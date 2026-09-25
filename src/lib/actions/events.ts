"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { BLOCK_TYPES, sanitizeSection, starterSections, type EditorSection } from "@/lib/blocks";
import { prisma } from "@/lib/db";
import { notifyMany } from "@/lib/notifications";
import { getEventAccess, requireUser, upgradeRole } from "@/lib/permissions";
import { prefixFromName, slugify } from "@/lib/utils";
import { eventSettingsSchema, fieldSchema, issueMessage } from "@/lib/validators";
import { parseCollegeDateTime } from "@/lib/format";

async function uniqueSlug(base: string, ignoreId?: string) {
  let slug = base || "event";
  let attempt = 1;
  while (true) {
    const existing = await prisma.event.findUnique({ where: { slug } });
    if (!existing || existing.id === ignoreId) return slug;
    attempt += 1;
    slug = `${base}-${attempt}`;
  }
}

export async function createEvent(clubId: string, name: string) {
  const user = await requireUser();
  const club = await prisma.club.findUnique({ where: { id: clubId }, include: { members: true } });
  if (!club) return { ok: false as const, error: "Club not found." };
  const allowed = user.role === "SUPER_ADMIN" || club.members.some((member) => member.userId === user.id && member.role === "CLUB_ADMIN");
  if (!allowed) return { ok: false as const, error: "You can only create events for your club." };
  const trimmed = name.trim();
  if (trimmed.length < 3) return { ok: false as const, error: "Give the event a name." };
  const start = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const event = await prisma.event.create({
    data: {
      clubId,
      createdById: user.id,
      name: trimmed,
      slug: await uniqueSlug(slugify(trimmed)),
      summary: `${trimmed} is happening at NMIET. Registration details will be published with the event page.`,
      startAt: start,
      endAt: new Date(start.getTime() + 8 * 60 * 60 * 1000),
      registrationDeadline: new Date(start.getTime() - 24 * 60 * 60 * 1000),
      mode: "OFFLINE",
      category: "Technical",
      registrationMode: "SOLO",
      registrationPrefix: prefixFromName(trimmed),
      venue: "NMIET Campus",
      sections: {
        create: starterSections().map((section, position) => ({
          type: section.type,
          position,
          visible: true,
          content: section.content as Prisma.InputJsonValue,
        })),
      },
    },
  });
  redirect(`/admin/events/${event.id}/builder`);
}

export async function saveEventSettings(eventId: string, input: unknown) {
  const user = await requireUser();
  const access = await getEventAccess(user, eventId);
  if (!access || access.level === "scan") return { ok: false as const, error: "You cannot edit this event." };
  const parsed = eventSettingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: issueMessage(parsed.error) };
  const startAt = parseCollegeDateTime(parsed.data.startAt);
  const endAt = parseCollegeDateTime(parsed.data.endAt);
  const registrationDeadline = parseCollegeDateTime(parsed.data.registrationDeadline);
  if (!startAt || !endAt || !registrationDeadline) return { ok: false as const, error: "Enter valid dates." };
  if (endAt <= startAt) return { ok: false as const, error: "The event must end after it starts." };
  if (access.level !== "full" && parsed.data.clubId !== access.event.clubId) {
    return { ok: false as const, error: "Only a club admin can move an event to another club." };
  }
  const slug = await uniqueSlug(parsed.data.slug, eventId);
  const max = parsed.data.maxParticipants.trim();
  const maxParticipants = max ? Number(max) : null;
  if (max && (!Number.isInteger(maxParticipants) || maxParticipants! < 1)) {
    return { ok: false as const, error: "Maximum participants must be a positive number, or left blank." };
  }
  await prisma.event.update({
    where: { id: eventId },
    data: {
      name: parsed.data.name,
      slug,
      summary: parsed.data.summary,
      description: parsed.data.description || null,
      coverImage: parsed.data.coverImage || null,
      startAt,
      endAt,
      registrationDeadline,
      venue: parsed.data.venue || null,
      mode: parsed.data.mode,
      category: parsed.data.category,
      maxParticipants,
      registrationMode: parsed.data.registrationMode,
      minTeamSize: parsed.data.minTeamSize,
      maxTeamSize: parsed.data.maxTeamSize,
      allowDuplicate: parsed.data.allowDuplicate,
      featured: parsed.data.featured,
      registrationPrefix: parsed.data.registrationPrefix,
      clubId: parsed.data.clubId,
    },
  });
  revalidatePath(`/events/${slug}`);
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath("/explore");
  return { ok: true as const, slug };
}

export async function saveEventSections(eventId: string, sections: EditorSection[]) {
  const user = await requireUser();
  const access = await getEventAccess(user, eventId);
  if (!access || access.level === "scan") return { ok: false as const, error: "You cannot edit this event page." };
  if (!Array.isArray(sections) || sections.length > 40) return { ok: false as const, error: "Too many sections." };
  try {
    const clean = sections.map((section, position) => ({
      type: section.type,
      position,
      visible: Boolean(section.visible),
      content: sanitizeSection(section.type, section.content) as Prisma.InputJsonValue,
    }));
    if (!clean.every((section) => BLOCK_TYPES.includes(section.type))) {
      return { ok: false as const, error: "Unknown block type." };
    }
    await prisma.$transaction([
      prisma.eventSection.deleteMany({ where: { eventId } }),
      prisma.eventSection.createMany({ data: clean.map((section) => ({ ...section, eventId })) }),
    ]);
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Could not save the page." };
  }
  revalidatePath(`/events/${access.event.slug}`);
  revalidatePath(`/admin/events/${eventId}/builder`);
  return { ok: true as const };
}

export async function setEventStatus(eventId: string, status: "DRAFT" | "PUBLISHED" | "ARCHIVED") {
  const user = await requireUser();
  const access = await getEventAccess(user, eventId);
  if (!access || (status === "ARCHIVED" && access.level !== "full") || access.level === "scan") {
    return { ok: false as const, error: "You cannot change this event's status." };
  }
  await prisma.event.update({ where: { id: eventId }, data: { status } });
  if (status === "PUBLISHED") {
    const students = await prisma.user.findMany({ where: { role: "STUDENT" }, select: { id: true } });
    await notifyMany(
      students.map((student) => student.id),
      {
        type: "EVENT_PUBLISHED",
        title: `${access.event.name} is open`,
        body: "A new event page is live. Open it to see the schedule and register.",
        href: `/events/${access.event.slug}`,
      },
    );
  }
  revalidatePath(`/events/${access.event.slug}`);
  revalidatePath("/explore");
  revalidatePath("/admin");
  return { ok: true as const };
}

export async function saveRegistrationField(eventId: string, input: unknown, fieldId?: string) {
  const user = await requireUser();
  const access = await getEventAccess(user, eventId);
  if (!access || access.level === "scan") return { ok: false as const, error: "You cannot edit registration fields." };
  const parsed = fieldSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: issueMessage(parsed.error) };
  const options = parsed.data.type === "SELECT"
    ? parsed.data.options.split(",").map((option) => option.trim()).filter(Boolean)
    : undefined;
  if (parsed.data.type === "SELECT" && (!options || options.length < 2)) {
    return { ok: false as const, error: "Add at least two comma-separated options." };
  }
  const data = {
    label: parsed.data.label,
    key: parsed.data.key,
    type: parsed.data.type,
    required: parsed.data.required,
    appliesTo: parsed.data.appliesTo,
    options: options ?? Prisma.JsonNull,
  };
  if (fieldId) {
    await prisma.registrationField.update({ where: { id: fieldId }, data });
  } else {
    const count = await prisma.registrationField.count({ where: { eventId } });
    await prisma.registrationField.create({ data: { ...data, eventId, position: count } });
  }
  revalidatePath(`/admin/events/${eventId}/settings`);
  return { ok: true as const };
}

export async function deleteRegistrationField(eventId: string, fieldId: string) {
  const user = await requireUser();
  const access = await getEventAccess(user, eventId);
  if (!access || access.level === "scan") return { ok: false as const, error: "You cannot edit registration fields." };
  await prisma.registrationField.delete({ where: { id: fieldId } });
  revalidatePath(`/admin/events/${eventId}/settings`);
  return { ok: true as const };
}

export async function assignStaff(eventId: string, email: string, role: "EVENT_MANAGER" | "VOLUNTEER") {
  const user = await requireUser();
  const access = await getEventAccess(user, eventId);
  if (!access || access.level !== "full") return { ok: false as const, error: "Only club admins can assign staff." };
  const member = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!member) return { ok: false as const, error: "No account found for that email." };
  await prisma.eventStaff.upsert({
    where: { eventId_userId: { eventId, userId: member.id } },
    update: { role },
    create: { eventId, userId: member.id, role },
  });
  const platformRole = role === "EVENT_MANAGER" ? "EVENT_MANAGER" : "VOLUNTEER";
  await prisma.user.update({ where: { id: member.id }, data: { role: upgradeRole(member.role, platformRole) } });
  revalidatePath(`/admin/events/${eventId}/settings`);
  return { ok: true as const };
}

export async function removeStaff(eventId: string, userId: string) {
  const user = await requireUser();
  const access = await getEventAccess(user, eventId);
  if (!access || access.level !== "full") return { ok: false as const, error: "Only club admins can remove staff." };
  await prisma.eventStaff.deleteMany({ where: { eventId, userId } });
  revalidatePath(`/admin/events/${eventId}/settings`);
  return { ok: true as const };
}
