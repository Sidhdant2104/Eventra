import Link from "next/link";
import { ButtonLink, EmptyState, StatusBadge } from "@/components/ui";
import { prisma } from "@/lib/db";
import { formatDay } from "@/lib/format";
import { requireUser } from "@/lib/permissions";

export const metadata = { title: "My events" };

export default async function RegistrationsPage({ searchParams }: { searchParams: Promise<{ ready?: string }> }) {
  const user = await requireUser();
  const query = await searchParams;
  const rows = await prisma.registrationParticipant.findMany({
    where: { userId: user.id },
    include: { registration: { include: { event: true, team: true } }, pass: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Your campus</p>
      <h1 className="mt-2 font-display text-5xl sm:text-6xl">My events</h1>
      {query.ready === "1" ? <p className="mt-4 text-secondary">You&apos;re registered. Open a pass below.</p> : null}
      <div className="mt-8">
        {rows.map((row) => (
          <article key={row.id} className="grid gap-3 border-t border-line py-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{row.registration.code}</p>
              <h2 className="mt-1 text-2xl font-medium tracking-[-0.03em]">{row.registration.event.name}</h2>
              <p className="mt-1 text-sm text-secondary">{formatDay(row.registration.event.startAt)}{row.registration.team ? ` · ${row.registration.team.name}` : ""}</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={row.registration.status} />
              {row.pass && row.registration.status !== "CANCELLED" && row.registration.status !== "WAITLISTED" ? <ButtonLink href={`/registrations/${row.id}`} size="sm" variant="ink">View pass</ButtonLink> : null}
            </div>
          </article>
        ))}
      </div>
      {rows.length === 0 ? <div className="mt-8"><EmptyState title="No registrations yet" body="When you register, the pass and status live here. Your profile stays the same for every event." action={<Link className="text-sm font-medium" href="/explore">Find an event</Link>} /></div> : null}
    </div>
  );
}
