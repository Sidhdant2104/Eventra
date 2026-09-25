import Link from "next/link";
import { ButtonLink, StatusBadge } from "@/components/ui";
import { prisma } from "@/lib/db";
import { formatDay } from "@/lib/format";
import { requireAdmin } from "@/lib/permissions";

export const metadata = { title: "Events" };

export default async function AdminEventsPage() {
  const user = await requireAdmin();
  const events = await prisma.event.findMany({
    where: user.role === "SUPER_ADMIN" ? {} : {
      OR: [
        { club: { members: { some: { userId: user.id, role: "CLUB_ADMIN" } } } },
        { staff: { some: { userId: user.id } } },
      ],
    },
    include: { club: true, _count: { select: { participants: true } } },
    orderBy: { startAt: "desc" },
  });
  const canCreate = user.role === "SUPER_ADMIN" || user.role === "CLUB_ADMIN";
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <h1 className="font-display text-5xl">Events</h1>
        {canCreate ? <ButtonLink href="/admin/events/new">New event</ButtonLink> : null}
      </div>
      <div className="mt-6 overflow-x-auto rounded-3xl border border-line bg-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-muted"><tr><th className="px-4 py-3">Event</th><th>Club</th><th>Date</th><th>People</th><th>Status</th></tr></thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-t border-line">
                <td className="px-4 py-3 font-medium"><Link href={`/admin/events/${event.id}`}>{event.name}</Link></td>
                <td>{event.club.name}</td>
                <td>{formatDay(event.startAt)}</td>
                <td>{event._count.participants}</td>
                <td><StatusBadge status={event.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
