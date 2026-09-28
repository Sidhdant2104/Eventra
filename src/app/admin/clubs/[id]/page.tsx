import { notFound } from "next/navigation";
import { ClubEditor } from "@/components/club-form";
import { prisma } from "@/lib/db";
import { canManageClub, requireUser } from "@/lib/permissions";

export default async function ClubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const club = await prisma.club.findUnique({
    where: { id },
    include: { members: { include: { user: { select: { name: true, email: true } } } }, events: { orderBy: { startAt: "desc" } } },
  });
  if (!club || !canManageClub(user, club)) notFound();
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
      <ClubEditor club={club} members={club.members} />
      <div>
        <h2 className="font-semibold">People</h2>
        <a className="mt-2 inline-block text-sm font-medium" href={`/admin/clubs/${club.id}/access`}>Teams and access</a>
        <h2 className="mt-6 font-semibold">Events</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {club.events.map((event) => <li key={event.id}><a className="font-medium" href={`/admin/events/${event.id}`}>{event.name}</a></li>)}
        </ul>
      </div>
    </div>
  );
}
