import Link from "next/link";
import { Card, StatusBadge } from "@/components/ui";
import { prisma } from "@/lib/db";
import { formatWhen } from "@/lib/format";
import { requireEventPermission } from "@/lib/permissions";

export default async function EventOverview({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const { event, permissions } = await requireEventPermission(eventId, "EVENT_VIEW");
  const showCounts = permissions.includes("ANALYTICS_VIEW") || permissions.includes("REGISTRATIONS_VIEW") || permissions.includes("ATTENDANCE_VIEW");
  const [registered, checked] = showCounts ? await Promise.all([
    prisma.registrationParticipant.count({ where: { eventId, registration: { status: { not: "CANCELLED" } } } }),
    prisma.attendance.count({ where: { eventId } }),
  ]) : [0, 0];
  const percent = registered === 0 ? 0 : Math.round((checked / registered) * 100);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2"><StatusBadge status={event.status} /><StatusBadge status={event.registrationMode} /></div>
      {showCounts ? <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4"><p className="text-sm text-muted">Registered</p><p className="font-display text-4xl">{registered}</p></Card>
        <Card className="p-4"><p className="text-sm text-muted">Checked in</p><p className="font-display text-4xl">{checked}</p></Card>
        <Card className="p-4"><p className="text-sm text-muted">Attendance</p><p className="font-display text-4xl">{percent}%</p></Card>
      </div> : null}
      <Card className="space-y-1 p-5 text-sm">
        <p>{formatWhen(event.startAt)} – {formatWhen(event.endAt)}</p>
        <p>{event.venue} · {event.mode.toLowerCase()}</p>
        <p>Registration closes {formatWhen(event.registrationDeadline)}</p>
        <Link className="inline-block pt-2 font-semibold" href={`/events/${event.slug}`}>Open event page</Link>
      </Card>
    </div>
  );
}
