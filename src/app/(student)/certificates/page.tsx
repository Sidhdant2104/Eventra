import Link from "next/link";
import { EventMedia } from "@/components/event-card";
import { EmptyState } from "@/components/ui";
import { certificateLabel } from "@/components/certificate-art";
import { prisma } from "@/lib/db";
import { formatDay } from "@/lib/format";
import { requireUser } from "@/lib/permissions";

export const metadata = { title: "Certificates" };

export default async function CertificatesPage() {
  const user = await requireUser();
  const certificates = await prisma.certificate.findMany({
    where: { userId: user.id },
    include: { event: { include: { club: true } } },
    orderBy: { issuedAt: "desc" },
  });
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Archive</p>
      <h1 className="mt-2 font-display text-5xl sm:text-6xl">My achievements</h1>
      <p className="mt-3 text-secondary">{certificates.filter((item) => !item.revokedAt).length} certificates</p>
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {certificates.map((certificate) => (
          <Link key={certificate.id} href={`/certificates/${certificate.id}`} className="group grid overflow-hidden bg-ink text-white sm:grid-cols-[148px_1fr]">
            <EventMedia src={certificate.event.coverImage} name={certificate.event.name} category={certificate.event.category} className="hidden h-full min-h-[220px] w-full object-cover sm:block" />
            <div className="p-6">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/50">{certificate.event.club.name}</p>
              <h2 className="mt-5 font-display text-4xl text-white">{certificate.event.name}</h2>
              <p className="mt-4 text-sm text-white/80">{certificateLabel(certificate.type, certificate.customLabel)}</p>
              <p className="mt-1 text-sm text-white/50">{formatDay(certificate.issuedAt)} · {certificate.publicId}</p>
              {certificate.revokedAt ? <p className="mt-2 text-sm text-accent">Revoked</p> : null}
              <span className="mt-6 inline-block text-sm text-accent">View certificate</span>
            </div>
          </Link>
        ))}
      </div>
      {certificates.length === 0 ? <div className="mt-8"><EmptyState title="Your achievements will appear here" body="After an event, organizers issue participation and winner certificates to this account. Each one can be verified publicly." /></div> : null}
    </div>
  );
}
