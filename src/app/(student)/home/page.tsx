import Link from "next/link";
import { EventCard } from "@/components/event-card";
import { ButtonLink, EmptyState } from "@/components/ui";
import { EVENT_CATEGORIES } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/permissions";
import { isProfileComplete } from "@/lib/utils";

export const metadata = { title: "Home" };

export default async function DashboardPage() {
  const user = await requireUser();
  const [registrations, teams, certificates, events, clubs] = await Promise.all([
    prisma.registrationParticipant.count({ where: { userId: user.id, registration: { status: { not: "CANCELLED" } } } }),
    prisma.teamMember.count({ where: { userId: user.id } }),
    prisma.certificate.count({ where: { userId: user.id, revokedAt: null } }),
    prisma.event.findMany({ where: { status: "PUBLISHED", endAt: { gte: new Date() } }, include: { club: true }, orderBy: [{ featured: "desc" }, { startAt: "asc" }], take: 6 }),
    prisma.club.findMany({ orderBy: { name: "asc" }, take: 6 }),
  ]);
  const featured = events.find((event) => event.featured) ?? events[0];
  const upcoming = events.filter((event) => event.id !== featured?.id);
  return (
    <div className="space-y-14">
      <section>
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted">NMIET One</p>
        <h1 className="mt-3 max-w-3xl font-display text-5xl sm:text-7xl">Discover what&apos;s happening across campus.</h1>
        <form action="/explore" className="mt-8 max-w-xl">
          <label className="sr-only" htmlFor="campus-search">Search events</label>
          <input id="campus-search" name="q" placeholder="Search events, clubs, workshops..." className="h-14 w-full border-b border-ink bg-transparent text-lg outline-none placeholder:text-muted" />
        </form>
        {!isProfileComplete(user) ? (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border border-line bg-surface px-4 py-3">
            <p className="text-sm text-secondary">Finish your profile once. After that, registration is a confirmation.</p>
            <ButtonLink href="/profile?complete=1" size="sm" variant="ink">Complete profile</ButtonLink>
          </div>
        ) : null}
      </section>

      {featured ? (
        <section>
          <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.18em] text-muted">Featured</p>
          <EventCard event={featured} layout="feature" />
        </section>
      ) : <EmptyState title="Campus is quiet" body="When a club publishes an event, it will take over this page." action={<ButtonLink href="/explore">Explore</ButtonLink>} />}

      {upcoming.length > 0 ? (
        <section>
          <div className="mb-5 flex items-end justify-between">
            <h2 className="font-display text-4xl sm:text-5xl">Upcoming</h2>
            <Link href="/explore?when=upcoming" className="text-sm font-medium">All upcoming</Link>
          </div>
          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 snap-x sm:mx-0 sm:px-0">
            {upcoming.map((event) => <div key={event.id} className="w-[68vw] max-w-[280px] shrink-0 sm:w-auto sm:max-w-none sm:flex-1"><EventCard event={event} /></div>)}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="font-display text-4xl sm:text-5xl">Explore by category</h2>
        <div className="mt-6 grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
          {EVENT_CATEGORIES.map((category) => (
            <Link key={category} href={`/explore?category=${encodeURIComponent(category)}`} className="bg-background px-4 py-6 text-lg font-medium tracking-[-0.03em] transition hover:bg-surface">
              {category}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-4xl sm:text-5xl">Your activity</h2>
        <div className="mt-6 grid border border-line sm:grid-cols-3">
          {[
            ["/registrations", "Registrations", registrations],
            ["/teams", "Teams", teams],
            ["/certificates", "Certificates", certificates],
          ].map(([href, label, value]) => (
            <Link key={String(href)} href={String(href)} className="border-b border-line px-5 py-6 last:border-b-0 hover:bg-surface sm:border-b-0 sm:border-r sm:last:border-r-0">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{label}</p>
              <p className="mt-2 font-display text-5xl">{value}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-4xl sm:text-5xl">Clubs</h2>
        <div className="mt-6 divide-y divide-line border-y border-line">
          {clubs.map((club) => (
            <Link key={club.id} href={`/explore?club=${club.slug}`} className="flex items-baseline justify-between gap-4 py-4 hover:text-accent">
              <span className="text-xl font-medium tracking-[-0.03em]">{club.name}</span>
              <span className="text-sm text-muted">View events</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
