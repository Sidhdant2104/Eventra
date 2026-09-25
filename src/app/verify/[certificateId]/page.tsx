import { CertificateArt, certificateLabel } from "@/components/certificate-art";
import { prisma } from "@/lib/db";

export default async function VerifyPage({ params }: { params: Promise<{ certificateId: string }> }) {
  const { certificateId } = await params;
  const certificate = await prisma.certificate.findUnique({
    where: { publicId: certificateId },
    include: { event: { include: { club: true } }, user: true, template: true },
  });
  const valid = Boolean(certificate && !certificate.revokedAt);
  const config = certificate?.template.config && typeof certificate.template.config === "object" ? certificate.template.config as { nameY?: number; metaY?: number } : null;
  return (
    <main id="content" className="mx-auto max-w-4xl px-4 py-10">
      <p className={`text-sm font-semibold uppercase tracking-[0.16em] ${valid ? "text-good" : "text-bad"}`}>{certificate ? (valid ? "Verified certificate" : "Revoked certificate") : "Certificate not found"}</p>
      <h1 className="mt-2 font-display text-5xl">{certificate ? certificate.user.name : "No matching record"}</h1>
      {certificate ? (
        <>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="text-muted">Event</dt><dd>{certificate.event.name}</dd></div>
            <div><dt className="text-muted">Club</dt><dd>{certificate.event.club.name}</dd></div>
            <div><dt className="text-muted">Type</dt><dd>{certificateLabel(certificate.type, certificate.customLabel)}</dd></div>
            <div><dt className="text-muted">Certificate ID</dt><dd>{certificate.publicId}</dd></div>
          </dl>
          <div className="mt-8">
            <CertificateArt
              publicId={certificate.publicId}
              recipient={certificate.user.name}
              eventName={certificate.event.name}
              clubName={certificate.event.club.name}
              typeLabel={certificateLabel(certificate.type, certificate.customLabel)}
              issuedAt={certificate.issuedAt}
              revoked={!valid}
              backgroundUrl={certificate.template.backgroundUrl}
              config={config}
            />
          </div>
        </>
      ) : <p className="mt-4 text-sm text-muted">Check the ID printed on the certificate. Verification does not expose email, phone, or roll number.</p>}
    </main>
  );
}
