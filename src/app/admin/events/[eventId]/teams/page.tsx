import { Card, StatusBadge } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireEventAccess } from "@/lib/permissions";

export default async function TeamsAdminPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  await requireEventAccess(eventId, ["full", "manage"]);
  const teams = await prisma.team.findMany({
    where: { eventId },
    include: { captain: true, members: { include: { user: true } }, registration: true, invitations: { where: { status: "PENDING" } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="grid gap-3">
      {teams.map((team) => (
        <Card key={team.id} className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{team.name}</h2>
            <StatusBadge status={team.status} />
          </div>
          <p className="mt-1 text-sm text-muted">Captain {team.captain.name}{team.registration ? ` · ${team.registration.code}` : ""}</p>
          <ul className="mt-3 text-sm">
            {team.members.map((member) => <li key={member.id}>{member.user.name} · joined</li>)}
            {team.invitations.map((invitation) => <li key={invitation.id} className="text-muted">{invitation.email} · pending</li>)}
          </ul>
        </Card>
      ))}
      {teams.length === 0 ? <p className="text-sm text-muted">No teams yet.</p> : null}
    </div>
  );
}
