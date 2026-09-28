import { AccessBoard } from "@/components/access-board";
import { prisma } from "@/lib/db";
import { requireEventPermission } from "@/lib/permissions";

export const metadata = { title: "Event access" };

export default async function EventAccessPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const { event } = await requireEventPermission(eventId, "DELEGATE");
  const units = await prisma.orgUnit.findMany({
    where: { eventId, archivedAt: null },
    orderBy: { name: "asc" },
    include: {
      members: {
        where: { removedAt: null },
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  return (
    <div>
      <h1 className="font-display text-4xl">Access</h1>
      <p className="mt-2 text-sm text-secondary">{event.name}</p>
      <div className="mt-6">
        <AccessBoard
          scope={{
            eventId,
            note: "People added here can work on this event only. A registration team does not see another event, and a design team does not see phone numbers unless that access is selected.",
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
    </div>
  );
}
