import Link from "next/link";
import { ButtonLink, StatusBadge } from "@/components/ui";
import { prisma } from "@/lib/db";
import { formatDay } from "@/lib/format";
import { requireAdmin } from "@/lib/permissions";

export const metadata = { title: "Events" };

export default async function AdminEventsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireAdmin();
  const query = (await searchParams).q?.trim() ?? "";
  const events = await prisma.event.findMany({
    where: {
      ...(query ? { name: { contains: query, mode: "insensitive" } } : {}),
      ...(user.role === "SUPER_ADMIN" ? {} : {
        OR: [
          { club: { members: { some: { userId: user.id, role: "CLUB_ADMIN" } } } },
          { staff: { some: { userId: user.id } } },
        ],
      }),
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
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-[11px] uppercase tracking-[0.14em] text-muted"><tr><th className="py-3 font-medium">Event</th><th className="font-medium">Club</th><th className="font-medium">Date</th><th className="font-medium">People</th><th className="font-medium">Status</th></tr></thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-t border-line hover:bg-white">
                <td className="py-3 font-medium"><Link href={`/admin/events/${event.id}`}>{event.name}</Link></td>
                <td>{event.club.name}</td>
                <td>{formatDay(event.startAt)}</td>
                <td>{event._count.participants}</td>
                <td><StatusBadge status={event.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {events.length === 0 ? <p className="border-t border-line py-8 text-sm text-muted">No events match that search.</p> : null}
      </div>
    </div>
  );
}
