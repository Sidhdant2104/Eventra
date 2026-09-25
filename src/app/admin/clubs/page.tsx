import Link from "next/link";
import { ButtonLink } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";

export const metadata = { title: "Clubs" };

export default async function ClubsPage() {
  const user = await requireAdmin();
  const clubs = await prisma.club.findMany({
    where: user.role === "SUPER_ADMIN" ? {} : { members: { some: { userId: user.id, role: "CLUB_ADMIN" } } },
    include: { _count: { select: { events: true, members: true } } },
    orderBy: { name: "asc" },
  });
  return (
    <div>
      <div className="flex items-end justify-between"><h1 className="font-display text-5xl">Clubs</h1>{user.role === "SUPER_ADMIN" ? <ButtonLink href="/admin/clubs/new">New club</ButtonLink> : null}</div>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {clubs.map((club) => (
          <Link key={club.id} href={`/admin/clubs/${club.id}`} className="rounded-3xl border border-line bg-card p-5">
            <h2 className="text-xl font-semibold">{club.name}</h2>
            <p className="mt-2 line-clamp-3 text-sm text-muted">{club.description}</p>
            <p className="mt-3 text-sm">{club._count.events} events · {club._count.members} members</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
