import { notFound } from "next/navigation";
import { AccessBoard } from "@/components/access-board";
import { prisma } from "@/lib/db";
import { formatWhen } from "@/lib/format";
import { canManageClub, requireUser } from "@/lib/permissions";

export const metadata = { title: "Club access" };

export default async function ClubAccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const club = await prisma.club.findUnique({
    where: { id },
    include: { members: { select: { userId: true, role: true } } },
  });
  if (!club || !canManageClub(user, club)) notFound();
  const events = await prisma.event.findMany({ where: { clubId: id }, select: { id: true } });
  const [units, logs] = await Promise.all([
    prisma.orgUnit.findMany({
    where: { clubId: id, archivedAt: null },
    orderBy: { name: "asc" },
    include: {
      members: {
        where: { removedAt: null },
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
    }),
    prisma.auditLog.findMany({
      where: {
        OR: [
          { scopeType: "CLUB", scopeId: id },
          { scopeType: "EVENT", scopeId: { in: events.map((event) => event.id) } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { actor: { select: { name: true } } },
    }),
  ]);
  return (
    <div>
      <h1 className="font-display text-4xl">{club.name}</h1>
      <p className="mt-2 text-sm text-secondary">People and teams</p>
      <div className="mt-6">
        <AccessBoard
          scope={{
            clubId: id,
            note: "A team created here can work across this club’s events. Create the team on an event instead when the work belongs to one event only.",
          }}
          units={units.map((unit) => ({
            id: unit.id,
            name: unit.name,
            parentId: unit.parentId,
            permissions: unit.permissions,
            members: unit.members.map((member) => ({
              userId: member.user.id,
              name: member.user.name,
              email: member.user.email,
              lead: member.lead,
            })),
          }))}
        />
      </div>
      <h2 className="mt-10 font-medium">Recent changes</h2>
      <ul className="mt-3 divide-y divide-line text-sm">
        {logs.map((log) => (
          <li key={log.id} className="flex justify-between gap-3 py-2">
            <span>{log.action.replaceAll("_", " ").toLowerCase()} · {log.actor.name}</span>
            <span className="text-muted">{formatWhen(log.createdAt)}</span>
          </li>
        ))}
        {logs.length === 0 ? <li className="py-2 text-muted">No changes recorded for this club yet.</li> : null}
      </ul>
    </div>
  );
}
