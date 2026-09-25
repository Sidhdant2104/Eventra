"use server";

import { CertificateType, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { certificatePublicId } from "@/lib/crypto";
import { prisma } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";
import { getEventAccess, requireUser } from "@/lib/permissions";
import { appUrl } from "@/lib/utils";

const defaultConfig = {
  accent: "#1f3fe0",
  nameY: 46,
  metaY: 62,
};

export async function saveCertificateTemplate(eventId: string, input: {
  id?: string;
  name: string;
  type: CertificateType;
  backgroundUrl?: string;
  nameY?: number;
  metaY?: number;
}) {
  const user = await requireUser();
  const access = await getEventAccess(user, eventId);
  if (!access || access.level === "scan") return { ok: false as const, error: "You cannot manage certificates." };
  const name = input.name.trim();
  if (name.length < 2) return { ok: false as const, error: "Name the template." };
  const config = {
    accent: defaultConfig.accent,
    nameY: Math.min(80, Math.max(20, input.nameY ?? 46)),
    metaY: Math.min(90, Math.max(30, input.metaY ?? 62)),
  };
  const data = {
    name,
    type: input.type,
    backgroundUrl: input.backgroundUrl?.trim() || null,
    config: config as Prisma.InputJsonValue,
  };
  if (input.id) await prisma.certificateTemplate.update({ where: { id: input.id }, data });
  else await prisma.certificateTemplate.create({ data: { ...data, eventId } });
  revalidatePath(`/admin/events/${eventId}/certificates`);
  return { ok: true as const };
}

export async function generateCertificates(eventId: string, templateId: string, userIds: string[]) {
  const user = await requireUser();
  const access = await getEventAccess(user, eventId);
  if (!access || access.level === "scan") return { ok: false as const, error: "You cannot issue certificates." };
  const template = await prisma.certificateTemplate.findFirst({ where: { id: templateId, eventId } });
  if (!template) return { ok: false as const, error: "Template not found." };
  const uniqueIds = [...new Set(userIds)];
  if (uniqueIds.length === 0) return { ok: false as const, error: "Select at least one participant." };
  const eligible = await prisma.registrationParticipant.findMany({
    where: {
      eventId,
      userId: { in: uniqueIds },
      registration: { status: { in: ["CONFIRMED", "ATTENDED"] } },
    },
    include: { user: true },
  });
  let created = 0;
  let skipped = 0;
  for (const participant of eligible) {
    const existing = await prisma.certificate.findUnique({
      where: { eventId_userId_type: { eventId, userId: participant.userId, type: template.type } },
    });
    if (existing) {
      skipped += 1;
      continue;
    }
    const certificate = await prisma.certificate.create({
      data: {
        publicId: certificatePublicId(),
        eventId,
        userId: participant.userId,
        templateId: template.id,
        type: template.type,
        customLabel: template.type === "CUSTOM" ? template.name : null,
      },
    });
    created += 1;
    await notifyUser({
      userId: participant.userId,
      type: "CERTIFICATE_AVAILABLE",
      title: `Certificate ready · ${access.event.name}`,
      body: `${template.name} is available to view and download.`,
      href: `/certificates/${certificate.id}`,
      email: {
        to: participant.user.email,
        subject: `Your certificate for ${access.event.name}`,
        text: `Your certificate is ready.\n\nView: ${appUrl()}/certificates/${certificate.id}\nVerify: ${appUrl()}/verify/${certificate.publicId}`,
      },
    });
  }
  revalidatePath(`/admin/events/${eventId}/certificates`);
  return { ok: true as const, created, skipped, missing: uniqueIds.length - eligible.length };
}

export async function revokeCertificate(eventId: string, certificateId: string, revoke: boolean) {
  const user = await requireUser();
  const access = await getEventAccess(user, eventId);
  if (!access || access.level === "scan") return { ok: false as const, error: "You cannot change certificates." };
  await prisma.certificate.update({
    where: { id: certificateId },
    data: { revokedAt: revoke ? new Date() : null },
  });
  revalidatePath(`/admin/events/${eventId}/certificates`);
  return { ok: true as const };
}
