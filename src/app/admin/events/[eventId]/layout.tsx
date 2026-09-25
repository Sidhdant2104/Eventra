import Link from "next/link";
import { notFound } from "next/navigation";
import { EventAdminNav } from "@/components/event-admin-nav";
import { prisma } from "@/lib/db";
import { formatDay } from "@/lib/format";
import { requireUser, getEventAccess } from "@/lib/permissions";

export default async function EventAdminLayout({ children, params }: { children: React.ReactNode; params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const user = await requireUser();
  const access = await getEventAccess(user, eventId);
  if (!access) notFound();
  const [registered, checked] = await Promise.all([
    prisma.registrationParticipant.count({ where: { eventId, registration: { status: { not: "CANCELLED" } } } }),
    prisma.attendance.count({ where: { eventId } }),
  ]);
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted">{access.event.club.name}</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl sm:text-5xl">{access.event.name}</h1>
          <p className="mt-3 text-sm text-secondary">{formatDay(access.event.startAt)}</p>
          <p className="mt-1 text-sm"><span className="font-medium">{registered}</span> registrations · <span className="font-medium">{checked}</span> checked in</p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link className="border border-line bg-surface px-3 py-2" href={`/events/${access.event.slug}`}>View event</Link>
          <Link className="bg-ink px-3 py-2 text-white" href={`/admin/events/${eventId}/scanner`}>Scan QR</Link>
        </div>
      </div>
      <div className="mt-5"><EventAdminNav eventId={eventId} level={access.level} /></div>
      {children}
    </div>
  );
}
