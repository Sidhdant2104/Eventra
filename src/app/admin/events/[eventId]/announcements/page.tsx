import { AnnouncementForm } from "@/components/announcement-form";
import { prisma } from "@/lib/db";
import { requireEventPermission } from "@/lib/permissions";

export default async function AnnouncementsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  await requireEventPermission(eventId, "ANNOUNCEMENT_SEND");
  const [people, history] = await Promise.all([
    prisma.registrationParticipant.findMany({
      where: { eventId, registration: { status: { not: "CANCELLED" } } },
      include: { user: true },
    }),
    prisma.announcement.findMany({ where: { eventId }, orderBy: { createdAt: "desc" } }),
  ]);
  return (
    <AnnouncementForm
      eventId={eventId}
      people={people.map((person) => ({ id: person.userId, name: person.user.name }))}
      history={history.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() }))}
    />
  );
}
