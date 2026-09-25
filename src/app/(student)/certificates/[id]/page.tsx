import Link from "next/link";
import { notFound } from "next/navigation";
import { CertificateArt, certificateLabel } from "@/components/certificate-art";
import { PrintButton } from "@/components/print-button";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/permissions";

export const metadata = { title: "Certificate" };

export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const certificate = await prisma.certificate.findFirst({
    where: { id, userId: user.id },
    include: { event: { include: { club: true } }, user: true, template: true },
  });
  if (!certificate) notFound();
  const config = certificate.template.config && typeof certificate.template.config === "object" ? certificate.template.config as { nameY?: number; metaY?: number; accent?: string } : null;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/certificates" className="text-sm font-medium">All certificates</Link>
        <PrintButton />
      </div>
      <div className="bg-[#eceae4] p-3 sm:p-8 print:bg-white print:p-0">
      <CertificateArt
        publicId={certificate.publicId}
        recipient={certificate.user.name}
        eventName={certificate.event.name}
        clubName={certificate.event.club.name}
        typeLabel={certificateLabel(certificate.type, certificate.customLabel)}
        issuedAt={certificate.issuedAt}
        revoked={Boolean(certificate.revokedAt)}
        backgroundUrl={certificate.template.backgroundUrl}
        config={config}
      />
      </div>
      <p className="text-center text-sm text-muted print:hidden">Anyone can verify this at <Link className="font-medium text-ink" href={`/verify/${certificate.publicId}`}>/verify/{certificate.publicId}</Link></p>
    </div>
  );
}
