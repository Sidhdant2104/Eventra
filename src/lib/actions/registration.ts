"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";
import { getEventAccess, requireUser } from "@/lib/permissions";
import { activeStatuses, allocateCode, dedupeFor, ensurePass, validateFieldResponses } from "@/lib/registration";
import { appUrl, isProfileComplete, registrationOpen } from "@/lib/utils";

async function loadEvent(slugOrId: { slug?: string; id?: string }) {
  return prisma.event.findUnique({
    where: slugOrId.slug ? { slug: slugOrId.slug } : { id: slugOrId.id },
    include: { fields: { orderBy: { position: "asc" } }, club: true },
  });
}

export async function registerSolo(slug: string, responses: Record<string, string>) {
  const user = await requireUser();
  if (!isProfileComplete(user)) {
    return { ok: false as const, error: "Complete your profile before registering.", code: "PROFILE" as const };
  }
  const event = await loadEvent({ slug });
  if (!event || event.status !== "PUBLISHED") return { ok: false as const, error: "This event is not open." };
  if (event.registrationMode === "TEAM") return { ok: false as const, error: "This event only accepts team registration." };
  if (!registrationOpen(event)) return { ok: false as const, error: "Registration is closed." };
  const validated = validateFieldResponses(event.fields, responses, "SOLO");
  if ("error" in validated && validated.error) return { ok: false as const, error: validated.error };
  const responsesClean = "clean" in validated ? validated.clean : [];

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.registrationParticipant.findFirst({
        where: { eventId: event.id, userId: user.id, registration: { status: { in: activeStatuses() } } },
      });
      if (existing && !event.allowDuplicate) throw new Error("ALREADY");
      const activeCount = await tx.registrationParticipant.count({
        where: { eventId: event.id, registration: { status: { in: ["CONFIRMED", "ATTENDED", "PENDING", "WAITLISTED"] } } },
      });
      const status = event.maxParticipants && activeCount >= event.maxParticipants ? "WAITLISTED" : "CONFIRMED";
      const code = await allocateCode(tx, event.id, event.registrationPrefix);
      const registration = await tx.registration.create({
        data: {
          eventId: event.id,
          userId: user.id,
          code,
          status,
          responses: { create: responsesClean },
        },
      });
      const participant = await tx.registrationParticipant.create({
        data: {
          registrationId: registration.id,
          eventId: event.id,
          userId: user.id,
          dedupeKey: dedupeFor(event.allowDuplicate, user.id, registration.id),
        },
      });
      if (status === "CONFIRMED") await ensurePass(tx, participant.id);
      return { code, status, participantId: participant.id };
    });

    await notifyUser({
      userId: user.id,
      type: "REGISTRATION_SUCCESS",
      title: result.status === "WAITLISTED" ? `Waitlisted for ${event.name}` : `You're registered for ${event.name}`,
      body: result.status === "WAITLISTED"
        ? `Registration ${result.code} is waitlisted. We'll notify you if a seat opens.`
        : `Registration ${result.code} is confirmed. Your QR pass is ready.`,
      href: `/registrations/${result.participantId}`,
      ...(user.email ? { email: {
        to: user.email,
        subject: `Registration ${result.code} · ${event.name}`,
        text: `Hi ${user.name},\n\nYour registration for ${event.name} is ${result.status.toLowerCase()}.\nRegistration ID: ${result.code}\n\nOpen your pass: ${appUrl()}/registrations/${result.participantId}`,
      } } : {}),
    });
    revalidatePath(`/events/${event.slug}`);
    revalidatePath("/registrations");
    revalidatePath("/home");
    return { ok: true as const, ...result };
  } catch (error) {
    if (error instanceof Error && (error.message === "ALREADY" || error.message.includes("Unique constraint"))) {
      return { ok: false as const, error: "You are already registered for this event." };
    }
    throw error;
  }
}

export async function cancelRegistration(registrationId: string) {
  const user = await requireUser();
  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: { event: true, participants: true, team: true },
  });
  if (!registration) return { ok: false as const, error: "Registration not found." };
  const isOwner = registration.userId === user.id || registration.team?.captainId === user.id;
  if (!isOwner) return { ok: false as const, error: "Only the registrant can cancel this." };
  if (!registrationOpen(registration.event) && registration.event.status === "PUBLISHED") {
    return { ok: false as const, error: "Registration has closed, so this entry can no longer be cancelled online." };
  }
  await prisma.$transaction(async (tx) => {
    await tx.registration.update({ where: { id: registration.id }, data: { status: "CANCELLED" } });
    for (const participant of registration.participants) {
      await tx.registrationParticipant.update({
        where: { id: participant.id },
        data: { dedupeKey: `${participant.userId}:cancelled:${participant.id}` },
      });
    }
    if (registration.teamId) {
      await tx.team.update({ where: { id: registration.teamId }, data: { status: "FORMING" } });
    }
  });
  revalidatePath("/registrations");
  revalidatePath(`/events/${registration.event.slug}`);
  return { ok: true as const };
}

export async function updateRegistrationStatus(eventId: string, registrationId: string, status: "CONFIRMED" | "WAITLISTED" | "CANCELLED" | "ATTENDED") {
  const user = await requireUser();
  const access = await getEventAccess(user, eventId);
  if (!access || access.level === "scan") return { ok: false as const, error: "You cannot change registrations." };
  const registration = await prisma.registration.findFirst({
    where: { id: registrationId, eventId },
    include: { participants: true, event: true, user: true },
  });
  if (!registration) return { ok: false as const, error: "Registration not found." };
  await prisma.$transaction(async (tx) => {
    await tx.registration.update({ where: { id: registration.id }, data: { status } });
    if (status === "CANCELLED") {
      for (const participant of registration.participants) {
        await tx.registrationParticipant.update({
          where: { id: participant.id },
          data: { dedupeKey: `${participant.userId}:cancelled:${participant.id}` },
        });
      }
    }
    if (status === "CONFIRMED" || status === "ATTENDED") {
      for (const participant of registration.participants) await ensurePass(tx, participant.id);
    }
  });
  if (status === "CONFIRMED") {
    await notifyManySafe(registration.participants.map((participant) => participant.userId), registration.event.name, registration.code);
  }
  revalidatePath(`/admin/events/${eventId}/registrations`);
  return { ok: true as const };
}

export async function bulkUpdateRegistrationStatus(
  eventId: string,
  registrationIds: string[],
  status: "CONFIRMED" | "WAITLISTED" | "CANCELLED" | "ATTENDED",
) {
  const unique = [...new Set(registrationIds)].slice(0, 100);
  for (const registrationId of unique) {
    const result = await updateRegistrationStatus(eventId, registrationId, status);
    if (!result.ok) return result;
  }
  return { ok: true as const };
}

async function notifyManySafe(userIds: string[], eventName: string, code: string) {
  await Promise.all(userIds.map((userId) => notifyUser({
    userId,
    type: "REGISTRATION_SUCCESS",
    title: `Registration confirmed · ${eventName}`,
    body: `${code} is confirmed. Your QR pass is ready.`,
    href: "/registrations",
  })));
}
