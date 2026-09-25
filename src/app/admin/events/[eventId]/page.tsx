import Link from "next/link";
import { Card, StatusBadge } from "@/components/ui";
import { prisma } from "@/lib/db";
import { formatWhen } from "@/lib/format";
import { requireEventAccess } from "@/lib/permissions";

export default async function EventOverview({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const { event } = await requireEventAccess(eventId);
  const [registered, checked] = await Promise.all([
    prisma.registrationParticipant.count({ where: { eventId, registration: { status: { not: "CANCELLED" } } } }),
    prisma.attendance.count({ where: { eventId } }),
  ]);
  const percent = registered === 0 ? 0 : Math.round((checked / registered) * 100);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2"><StatusBadge status={event.status} /><StatusBadge status={event.registrationMode} /></div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4"><p className="text-sm text-muted">Registered</p><p className="font-display text-4xl">{registered}</p></Card>
        <Card className="p-4"><p className="text-sm text-muted">Checked in</p><p className="font-display text-4xl">{checked}</p></Card>
        <Card className="p-4"><p className="text-sm text-muted">Attendance</p><p className="font-display text-4xl">{percent}%</p></Card>
      </div>
      <Card className="space-y-1 p-5 text-sm">
        <p>{formatWhen(event.startAt)} – {formatWhen(event.endAt)}</p>
        <p>{event.venue} · {event.mode.toLowerCase()}</p>
        <p>Registration closes {formatWhen(event.registrationDeadline)}</p>
        <Link className="inline-block pt-2 font-semibold" href={`/events/${event.slug}`}>Open event page</Link>
      </Card>
    </div>
  );
}
