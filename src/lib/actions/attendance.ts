"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getEventAccess, requireUser } from "@/lib/permissions";
import { parsePassToken } from "@/lib/utils";
import { formatWhen } from "@/lib/format";

export async function lookupPass(eventId: string, raw: string) {
  const user = await requireUser();
  const access = await getEventAccess(user, eventId);
  if (!access) return { ok: false as const, error: "You cannot scan for this event." };
  const token = parsePassToken(raw);
  if (!token) return { ok: true as const, state: "invalid" as const, message: "This QR code is not an NMIET One pass." };
  const pass = await prisma.qrPass.findUnique({
    where: { token },
    include: {
      participant: {
        include: {
          user: { select: { id: true, name: true } },
          registration: { include: { team: true, event: true } },
        },
      },
    },
  });
  if (!pass || pass.participant.eventId !== eventId) {
    return { ok: true as const, state: "invalid" as const, message: "Invalid pass for this event." };
  }
  const registration = pass.participant.registration;
  if (registration.status === "CANCELLED" || registration.status === "WAITLISTED" || registration.status === "PENDING") {
    return {
      ok: true as const,
      state: "invalid" as const,
      message: registration.status === "WAITLISTED" ? "This registration is still waitlisted." : "This registration is not confirmed.",
    };
  }
  const attendance = await prisma.attendance.findUnique({
    where: { eventId_userId: { eventId, userId: pass.participant.userId } },
  });
  const payload = {
    name: pass.participant.user.name,
    team: registration.team?.name ?? null,
    code: registration.code,
    event: registration.event.name,
    token,
  };
  if (attendance) {
    return { ok: true as const, state: "already" as const, message: "Already checked in", checkedInAt: formatWhen(attendance.checkedInAt), ...payload };
  }
  return { ok: true as const, state: "valid" as const, message: "Valid pass", ...payload };
}

export async function markAttendance(eventId: string, raw: string) {
  const user = await requireUser();
  const access = await getEventAccess(user, eventId);
  if (!access) return { ok: false as const, error: "You cannot mark attendance for this event." };
  const lookedUp = await lookupPass(eventId, raw);
  if (!lookedUp.ok) return lookedUp;
  if (lookedUp.state === "invalid") return { ok: false as const, error: lookedUp.message };
  if (lookedUp.state === "already") {
    return { ok: true as const, state: "already" as const, message: "Already checked in", checkedInAt: lookedUp.checkedInAt, name: lookedUp.name, team: lookedUp.team, code: lookedUp.code };
  }
  const pass = await prisma.qrPass.findUnique({
    where: { token: lookedUp.token },
    include: { participant: { include: { registration: { include: { participants: true } } } } },
  });
  if (!pass) return { ok: false as const, error: "Invalid pass." };
  try {
    const attendance = await prisma.attendance.create({
      data: {
        eventId,
        registrationId: pass.participant.registrationId,
        userId: pass.participant.userId,
        scannerId: user.id,
      },
    });
    const checked = await prisma.attendance.count({ where: { registrationId: pass.participant.registrationId } });
    if (checked >= pass.participant.registration.participants.length) {
      await prisma.registration.update({ where: { id: pass.participant.registrationId }, data: { status: "ATTENDED" } });
    }
    revalidatePath(`/admin/events/${eventId}/attendance`);
    return {
      ok: true as const,
      state: "checked" as const,
      message: "Attendance marked",
      checkedInAt: formatWhen(attendance.checkedInAt),
      name: lookedUp.name,
      team: lookedUp.team,
      code: lookedUp.code,
    };
  } catch {
    const existing = await prisma.attendance.findUnique({ where: { eventId_userId: { eventId, userId: pass.participant.userId } } });
    return {
      ok: true as const,
      state: "already" as const,
      message: "Already checked in",
      checkedInAt: existing ? formatWhen(existing.checkedInAt) : "",
      name: lookedUp.name,
      team: lookedUp.team,
      code: lookedUp.code,
    };
  }
}
