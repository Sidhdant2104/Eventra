import Link from "next/link";
import { Avatar, ButtonLink, EmptyState, StatusBadge } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/permissions";

export const metadata = { title: "Teams" };

export default async function TeamsPage() {
  const user = await requireUser();
  const [memberships, invitations] = await Promise.all([
    prisma.teamMember.findMany({
      where: { userId: user.id },
      include: { team: { include: { event: true, members: { include: { user: true } }, captain: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.teamInvitation.findMany({
      where: { status: "PENDING", expiresAt: { gt: new Date() }, OR: user.email ? [{ inviteeId: user.id }, { email: user.email }] : [{ inviteeId: user.id }] },
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
        <h2 className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Invitations</h2>
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
      <section className="grid gap-4 sm:grid-cols-2">
        {memberships.map((membership) => (
          <Link key={membership.id} href={`/teams/${membership.teamId}`} className="border border-line bg-surface p-5 transition hover:-translate-y-0.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{membership.team.event.name}</p>
                <h2 className="mt-2 text-3xl font-medium tracking-[-0.04em]">{membership.team.name}</h2>
              </div>
              <StatusBadge status={membership.team.status} />
            </div>
            <p className="mt-4 text-sm text-secondary">{membership.team.members.length} members · Captain {membership.team.captain.name}</p>
            <div className="mt-4 flex -space-x-2">
              {membership.team.members.slice(0, 5).map((member) => (
                <Avatar key={member.id} name={member.user.name} className="ring-2 ring-surface" />
              ))}
            </div>
          </Link>
        ))}
      </section>
      {memberships.length === 0 ? <EmptyState title="You haven't joined a team yet" body="Open a team event and create one, or accept an invitation from a captain." action={<ButtonLink href="/explore">Explore events</ButtonLink>} /> : null}
    </div>
  );
}
