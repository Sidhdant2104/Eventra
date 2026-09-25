"use server";

import { AnnouncementAudience, NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { emailUsers, notifyMany } from "@/lib/notifications";
import { getEventAccess, requireUser } from "@/lib/permissions";

export async function sendAnnouncement(eventId: string, input: {
  title: string;
  body: string;
  audience: AnnouncementAudience;
  userIds?: string[];
  kind: "ANNOUNCEMENT" | "VENUE_CHANGED" | "EVENT_UPDATE" | "EVENT_REMINDER" | "DEADLINE_APPROACHING";
}) {
  const user = await requireUser();
  const access = await getEventAccess(user, eventId);
  if (!access || access.level === "scan") return { ok: false as const, error: "You cannot send announcements." };
  const title = input.title.trim();
  const body = input.body.trim();
  if (title.length < 3 || body.length < 3) return { ok: false as const, error: "Add a title and a message." };

  const registrations = await prisma.registration.findMany({
    where: { eventId, status: { in: ["CONFIRMED", "ATTENDED", "WAITLISTED", "PENDING"] } },
    include: { participants: true, team: true, attendance: true },
  });
  let userIds: string[] = [];
  if (input.audience === "ALL_REGISTERED") userIds = registrations.flatMap((registration) => registration.participants.map((participant) => participant.userId));
  if (input.audience === "CAPTAINS") {
    userIds = registrations.flatMap((registration) => registration.team ? [registration.team.captainId] : registration.userId ? [registration.userId] : []);
  }
  if (input.audience === "ATTENDEES") userIds = registrations.flatMap((registration) => registration.attendance.map((row) => row.userId));
  if (input.audience === "SPECIFIC") userIds = input.userIds ?? [];
  userIds = [...new Set(userIds)];
  if (userIds.length === 0) return { ok: false as const, error: "Nobody matches that audience." };

  await prisma.announcement.create({
    data: { eventId, authorId: user.id, title, body, audience: input.audience },
  });
  const type = input.kind as NotificationType;
  await notifyMany(userIds, { type, title, body, href: `/events/${access.event.slug}` });
  const recipients = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { email: true } });
  await emailUsers(recipients.map((recipient) => ({
    to: recipient.email,
    subject: `${title} · ${access.event.name}`,
    text: `${body}\n\n${access.event.name}`,
  })));
  revalidatePath(`/admin/events/${eventId}/announcements`);
  return { ok: true as const, sent: userIds.length };
}
