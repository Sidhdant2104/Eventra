import Link from "next/link";
import { notFound } from "next/navigation";
import { TeamTools } from "@/components/team-tools";
import { StatusBadge } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/permissions";
import { appUrl } from "@/lib/utils";

export const metadata = { title: "Team" };

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      event: { include: { fields: { orderBy: { position: "asc" } } } },
      captain: true,
      members: { include: { user: { include: { profile: true } } }, orderBy: { createdAt: "asc" } },
      invitations: { where: { status: "PENDING" }, include: { invitee: true } },
      registration: true,
    },
  });
  if (!team || !team.members.some((member) => member.userId === user.id)) notFound();
  const participant = team.registration
    ? await prisma.registrationParticipant.findFirst({ where: { registrationId: team.registration.id, userId: user.id } })
    : null;
  return (
    <div className="space-y-8">
      <Link href="/teams" className="text-sm text-muted">All teams</Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">{team.event.name}</p>
          <h1 className="mt-2 font-display text-5xl sm:text-6xl">{team.name}</h1>
        </div>
        <StatusBadge status={team.status} />
      </div>
      <div>
        <div className="flex items-end justify-between">
          <h2 className="text-sm uppercase tracking-[0.16em] text-muted">Roster</h2>
          <p className="text-sm text-secondary">{team.members.length} / {team.event.maxTeamSize} · minimum {team.event.minTeamSize}</p>
        </div>
        <ul className="mt-3">
          {team.members.map((member) => (
            <li key={member.id} className="flex items-center justify-between gap-3 border-t border-line py-3 text-sm">
              <span className="font-medium">{member.user.name}</span>
              <span className="text-muted">{member.userId === team.captainId ? "Captain" : "Joined"}</span>
            </li>
          ))}
          {team.invitations.map((invitation) => (
            <li key={invitation.id} className="flex items-center justify-between gap-3 border-t border-line py-3 text-sm text-secondary">
              <span>{invitation.invitee?.name ?? invitation.email}</span>
              <span>Pending</span>
            </li>
          ))}
        </ul>
      </div>
      {participant ? <Link className="inline-block font-semibold text-brand" href={`/registrations/${participant.id}`}>View your pass · {team.registration?.code}</Link> : null}
      <TeamTools
        teamId={team.id}
        captain={team.captainId === user.id}
        forming={team.status === "FORMING"}
        inviteLink={`${appUrl()}/invite/${team.inviteToken}`}
        fields={team.event.fields}
        members={team.members.filter((member) => member.userId !== user.id).map((member) => ({ id: member.userId, name: member.user.name }))}
      />
    </div>
  );
}
