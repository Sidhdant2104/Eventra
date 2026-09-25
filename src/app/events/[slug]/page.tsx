import { notFound } from "next/navigation";
import { EventPageView } from "@/components/event-page";
import { prisma } from "@/lib/db";
import { getCurrentUser, getEventAccess } from "@/lib/permissions";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await prisma.event.findUnique({ where: { slug } });
  return { title: event?.name ?? "Event" };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await prisma.event.findUnique({
    where: { slug },
    include: { club: true, sections: { orderBy: { position: "asc" } } },
  });
  if (!event) notFound();
  const user = await getCurrentUser();
  const access = user ? await getEventAccess(user, event.id) : null;
  if (event.status !== "PUBLISHED" && !access) notFound();
  const participant = user
    ? await prisma.registrationParticipant.findFirst({
      where: { userId: user.id, eventId: event.id, registration: { status: { not: "CANCELLED" } } },
    })
    : null;
  return (
    <EventPageView
      event={event}
      loggedIn={Boolean(user)}
      participantId={participant?.id}
      draft={event.status !== "PUBLISHED"}
    />
  );
}
