import { EventSettingsForm, FieldManager, PublishControls, StaffManager } from "@/components/event-settings";
import { Card } from "@/components/ui";
import { prisma } from "@/lib/db";
import { formatDateTimeLocal } from "@/lib/format";
import { requireEventAccess } from "@/lib/permissions";

export default async function SettingsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const { event, level } = await requireEventAccess(eventId, ["full", "manage"]);
  const [clubs, fields, staff] = await Promise.all([
    prisma.club.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.registrationField.findMany({ where: { eventId }, orderBy: { position: "asc" } }),
    prisma.eventStaff.findMany({ where: { eventId }, include: { user: { select: { name: true, email: true } } } }),
  ]);
  return (
    <div className="space-y-6">
      <PublishControls eventId={eventId} status={event.status} />
      <Card className="p-5">
        <h2 className="mb-4 text-lg font-semibold">Event configuration</h2>
        <EventSettingsForm
          eventId={eventId}
          clubs={level === "full" ? clubs : clubs.filter((club) => club.id === event.clubId)}
          values={{
            name: event.name,
            slug: event.slug,
            summary: event.summary,
            description: event.description ?? "",
            coverImage: event.coverImage ?? "",
            startAt: formatDateTimeLocal(event.startAt),
            endAt: formatDateTimeLocal(event.endAt),
            registrationDeadline: formatDateTimeLocal(event.registrationDeadline),
            venue: event.venue ?? "",
            mode: event.mode,
            category: event.category,
            maxParticipants: event.maxParticipants ? String(event.maxParticipants) : "",
            registrationMode: event.registrationMode,
            minTeamSize: event.minTeamSize,
            maxTeamSize: event.maxTeamSize,
            allowDuplicate: event.allowDuplicate,
            featured: event.featured,
            registrationPrefix: event.registrationPrefix,
            clubId: event.clubId,
          }}
        />
      </Card>
      <Card className="p-5">
        <h2 className="mb-2 text-lg font-semibold">Extra registration questions</h2>
        <p className="mb-4 text-sm text-muted">These are event-specific. They do not change the student profile.</p>
        <FieldManager eventId={eventId} fields={fields} />
      </Card>
      {level === "full" ? (
        <Card className="p-5">
          <h2 className="mb-4 text-lg font-semibold">Event staff</h2>
          <StaffManager eventId={eventId} staff={staff.map((member) => ({ userId: member.userId, role: member.role, user: member.user }))} />
        </Card>
      ) : null}
    </div>
  );
}
