import Link from "next/link";
import { redirect } from "next/navigation";
import { EventCard } from "@/components/event-card";
import { ButtonLink, EmptyState } from "@/components/ui";
import { EVENT_CATEGORIES } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { greeting } from "@/lib/format";
import { requireUser } from "@/lib/permissions";
import { isProfileComplete } from "@/lib/utils";

export const metadata = { title: "Home" };

export default async function DashboardPage() {
  const user = await requireUser();
  if (user.role === "STUDENT" && !isProfileComplete(user)) redirect("/onboarding");
  const [mine, teams, certificates, events] = await Promise.all([
    prisma.registrationParticipant.findMany({
      where: { userId: user.id, registration: { status: { not: "CANCELLED" } } },
      include: { registration: { include: { event: { include: { club: true } }, team: true } }, pass: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.teamMember.findMany({
      where: { userId: user.id },
      include: { team: { include: { event: true, members: { include: { user: true } }, captain: true } } },
      orderBy: { createdAt: "desc" },
      take: 2,
    }),
    prisma.certificate.findMany({
      where: { userId: user.id, revokedAt: null },
      include: { event: { include: { club: true } } },
      orderBy: { issuedAt: "desc" },
      take: 2,
    }),
    prisma.event.findMany({
      where: { status: "PUBLISHED", endAt: { gte: new Date() } },
      include: { club: true },
      orderBy: [{ featured: "desc" }, { startAt: "asc" }],
      take: 6,
    }),
  ]);
  const registeredIds = new Set(mine.map((row) => row.registration.eventId));
  const nextMine = mine.find((row) => row.registration.event.endAt >= new Date());
  const spotlight = nextMine?.registration.event ?? events[0];
  const discover = events.filter((event) => event.id !== spotlight?.id && !registeredIds.has(event.id)).slice(0, 4);
  const first = user.name.split(" ")[0];

  return (
    <div className="space-y-14">
      <section>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">{greeting()}</p>
        <h1 className="mt-2 font-display text-5xl sm:text-6xl">{first}.</h1>
        <p className="mt-3 max-w-xl text-[16px] leading-7 text-secondary">Here&apos;s what&apos;s happening around campus.</p>
        {!isProfileComplete(user) ? (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border border-line bg-surface px-4 py-3">
            <p className="text-sm text-secondary">Finish your profile once. After that, registration is a confirmation.</p>
            <ButtonLink href="/profile?complete=1" size="sm" variant="ink">Complete profile</ButtonLink>
          </div>
        ) : null}
      </section>

      <section>
        <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.18em] text-muted">Upcoming for you</p>
        {spotlight ? <EventCard event={spotlight} layout="featured" /> : <EmptyState title="Campus is quiet" body="When a club publishes an event, it will show up here." action={<ButtonLink href="/explore">Explore</ButtonLink>} />}
        {nextMine?.pass ? <Link href={`/registrations/${nextMine.id}`} className="mt-3 inline-block text-sm font-medium">Open your pass →</Link> : null}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-4xl">My events</h2>
          <Link href="/registrations" className="text-sm font-medium">All</Link>
        </div>
        {mine.length === 0 ? <p className="text-sm text-muted">You have not registered yet.</p> : mine.map((row) => (
          <Link key={row.id} href={row.pass ? `/registrations/${row.id}` : `/events/${row.registration.event.slug}`} className="grid gap-1 border-t border-line py-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{row.registration.event.club.name}</p>
              <h3 className="mt-1 text-xl font-medium tracking-[-0.03em]">{row.registration.event.name}</h3>
            </div>
            <span className="text-sm text-secondary">{row.pass ? "View pass" : row.registration.status.toLowerCase()}</span>
          </Link>
        ))}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-4xl">Your teams</h2>
          <Link href="/teams" className="text-sm font-medium">All</Link>
        </div>
        {teams.length === 0 ? <p className="text-sm text-muted">You haven&apos;t joined a team yet.</p> : (
          <div className="grid gap-4 sm:grid-cols-2">
            {teams.map((membership) => (
              <Link key={membership.id} href={`/teams/${membership.teamId}`} className="border border-line bg-surface p-5">
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{membership.team.event.name}</p>
                <h3 className="mt-2 text-2xl font-medium tracking-[-0.03em]">{membership.team.name}</h3>
                <p className="mt-3 text-sm text-secondary">{membership.team.members.length} members · Captain {membership.team.captain.name.split(" ")[0]}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-4xl">Your certificates</h2>
          <Link href="/certificates" className="text-sm font-medium">Archive</Link>
        </div>
        {certificates.length === 0 ? <p className="text-sm text-muted">Your achievements will appear here.</p> : (
          <div className="grid gap-4 sm:grid-cols-2">
            {certificates.map((certificate) => (
              <Link key={certificate.id} href={`/certificates/${certificate.id}`} className="bg-ink p-5 text-white">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/50">{certificate.event.club.name}</p>
                <h3 className="mt-4 font-display text-4xl text-white">{certificate.event.name}</h3>
                <p className="mt-4 text-sm text-accent">View certificate</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {discover.length > 0 ? (
        <section>
          <div className="mb-5 flex items-end justify-between">
            <h2 className="font-display text-4xl">Discover</h2>
            <Link href="/explore" className="text-sm font-medium">Explore</Link>
          </div>
          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0">
            {discover.map((event) => <div key={event.id} className="w-[68vw] max-w-[260px] shrink-0 sm:w-auto sm:max-w-none"><EventCard event={event} layout="compact" /></div>)}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="font-display text-4xl">Explore by category</h2>
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4">
          {EVENT_CATEGORIES.map((category) => (
            <Link key={category} href={`/explore?category=${encodeURIComponent(category)}`} className="border-b border-line py-4 text-lg font-medium tracking-[-0.03em] hover:text-accent">
              {category}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
