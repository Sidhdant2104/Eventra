import { CertificateManager } from "@/components/certificate-manager";
import { prisma } from "@/lib/db";
import { requireEventAccess } from "@/lib/permissions";

export default async function CertificatesAdminPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  await requireEventAccess(eventId, ["full", "manage"]);
  const [templates, participants, certificates] = await Promise.all([
    prisma.certificateTemplate.findMany({ where: { eventId }, orderBy: { createdAt: "desc" } }),
    prisma.registrationParticipant.findMany({
      where: { eventId, registration: { status: { in: ["CONFIRMED", "ATTENDED"] } } },
      include: { user: true, registration: true },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.certificate.findMany({ where: { eventId }, include: { user: true }, orderBy: { issuedAt: "desc" } }),
  ]);
  return (
    <CertificateManager
      eventId={eventId}
      templates={templates}
      people={participants.map((participant) => ({ id: participant.userId, name: participant.user.name, status: participant.registration.status }))}
      issued={certificates.map((certificate) => ({ id: certificate.id, publicId: certificate.publicId, name: certificate.user.name, type: certificate.type, revoked: Boolean(certificate.revokedAt) }))}
    />
  );
}
