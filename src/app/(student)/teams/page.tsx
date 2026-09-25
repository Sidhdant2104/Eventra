import Link from "next/link";
import { ButtonLink, EmptyState, StatusBadge } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/permissions";

export const metadata = { title: "Teams" };

export default async function TeamsPage() {
  const user = await requireUser();
  const [memberships, invitations] = await Promise.all([
    prisma.teamMember.findMany({
      where: { userId: user.id },
      include: { team: { include: { event: true, members: true, captain: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.teamInvitation.findMany({
      where: { status: "PENDING", expiresAt: { gt: new Date() }, OR: [{ inviteeId: user.id }, { email: user.email }] },
      include: { team: { include: { event: true, captain: true } } },
    }),
  ]);
  return (
    <div className="space-y-12">
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Together</p>
        <h1 className="mt-2 font-display text-5xl sm:text-6xl">Teams</h1>
        <p className="mt-3 max-w-xl text-[15px] leading-7 text-secondary">The captain registers the roster. Members do not fill a second form.</p>
      </div>
      <section>
        <h2 className="text-sm font-medium uppercase tracking-[0.16em] text-muted">Invitations</h2>
        <div className="mt-4">
          {invitations.map((invitation) => (
            <article key={invitation.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-4">
              <div>
                <h3 className="text-xl font-medium tracking-[-0.03em]">{invitation.team.name}</h3>
                <p className="text-sm text-secondary">{invitation.team.captain.name} invited you to {invitation.team.event.name}</p>
              </div>
              <ButtonLink href={`/invite/${invitation.token}`} size="sm" variant="ink">Respond</ButtonLink>
            </article>
          ))}
          {invitations.length === 0 ? <p className="border-t border-line py-4 text-sm text-muted">No pending invitations.</p> : null}
        </div>
      </section>
      <section>
        {memberships.map((membership) => (
          <Link key={membership.id} href={`/teams/${membership.teamId}`} className="grid gap-2 border-t border-line py-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <h2 className="text-2xl font-medium tracking-[-0.03em]">{membership.team.name}</h2>
              <p className="mt-1 text-sm text-secondary">{membership.team.event.name} · {membership.team.members.length} members · Captain {membership.team.captain.name}</p>
            </div>
            <StatusBadge status={membership.team.status} />
          </Link>
        ))}
        {memberships.length === 0 ? <EmptyState title="You haven't joined a team yet" body="Open a team event and create one, or accept an invitation from a captain." action={<ButtonLink href="/explore">Explore events</ButtonLink>} /> : null}
      </section>
    </div>
  );
}
