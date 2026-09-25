import Link from "next/link";
import { EventCard, EventMedia } from "@/components/event-card";
import { Logo } from "@/components/logo";
import { ButtonLink } from "@/components/ui";
import { eventTheme } from "@/lib/event-theme";
import { prisma } from "@/lib/db";
import { formatDay } from "@/lib/format";

export default async function HomePage() {
  const [events, clubs] = await Promise.all([
    prisma.event.findMany({ where: { status: "PUBLISHED" }, include: { club: true }, orderBy: [{ featured: "desc" }, { startAt: "asc" }], take: 4 }),
    prisma.club.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { events: true } } } }),
  ]);
  const [featured, ...rest] = events;
  const theme = featured ? eventTheme(featured.category) : null;
  return (
    <div>
      <header className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/explore" className="text-muted hover:text-ink">Explore</Link>
          <Link href="/login" className="bg-ink px-4 py-2 text-white">Sign in</Link>
        </nav>
      </header>
      <main id="content">
        <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-8 pt-6 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:pt-10">
          <div className="rise">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted">NMIET One</p>
            <h1 className="mt-4 font-display text-[2.7rem] leading-[0.92] text-ink sm:text-6xl lg:text-7xl">
              One profile.<br />Every event.<br />One campus.
            </h1>
            <p className="mt-5 max-w-md text-[16px] leading-7 text-secondary">Register once, carry a pass, join a team, and keep every certificate on the same profile.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href="/explore" size="lg" variant="ink">Explore events</ButtonLink>
              <ButtonLink href="/register" size="lg" variant="outline">Create your profile</ButtonLink>
            </div>
          </div>
          {featured && theme ? (
            <div>
              <div className="grid gap-3 lg:hidden">
                <EventMedia src={featured.coverImage} name={featured.name} category={featured.category} className="aspect-[4/5] w-full" />
                <PassStrip event={featured} accent={theme.accent} />
              </div>
              <div className="relative hidden min-h-[540px] lg:block">
                <div className="absolute right-0 top-0 h-[72%] w-[78%] overflow-hidden">
                  <EventMedia src={featured.coverImage} name={featured.name} category={featured.category} className="h-full w-full object-cover" />
                </div>
                <div className="absolute bottom-16 left-0 w-[54%]">
                  <PassStrip event={featured} accent={theme.accent} />
                </div>
                {rest[0] ? (
                  <Link href={`/events/${rest[0].slug}`} className="absolute bottom-0 right-0 w-[42%] border border-line bg-surface px-4 py-3 transition hover:-translate-y-0.5">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Also coming</p>
                    <p className="mt-1 text-lg font-medium tracking-[-0.03em]">{rest[0].name}</p>
                    <p className="text-sm text-secondary">{rest[0].club.name} · {formatDay(rest[0].startAt)}</p>
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>

        {featured ? (
          <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.18em] text-muted">Featured</p>
            <EventCard event={featured} layout="featured" />
          </section>
        ) : null}

        {rest.length > 0 ? (
          <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <div className="mb-5 flex items-end justify-between">
              <h2 className="font-display text-4xl sm:text-5xl">Coming up</h2>
              <Link href="/explore" className="text-sm font-medium">See all</Link>
            </div>
            <div className="grid gap-8 sm:grid-cols-3">
              {rest.map((event) => <EventCard key={event.id} event={event} layout="compact" />)}
            </div>
          </section>
        ) : null}

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <h2 className="font-display text-4xl sm:text-5xl">Clubs</h2>
          <div className="mt-6 divide-y divide-line border-y border-line">
            {clubs.map((club) => (
              <article key={club.id} className="grid gap-2 py-5 sm:grid-cols-[200px_1fr_auto] sm:items-center">
                <h3 className="text-xl font-medium tracking-[-0.03em]">{club.name}</h3>
                <p className="text-sm leading-6 text-secondary">{club.description}</p>
                <p className="text-sm text-muted">{club._count.events} events</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function PassStrip({ event, accent }: { event: { name: string; venue: string | null; startAt: Date; club: { name: string } }; accent: string }) {
  return (
    <div className="bg-ink px-5 py-5 text-white">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-white/50">
        <span>Pass</span>
        <span>{event.club.name}</span>
      </div>
      <p className="mt-4 font-display text-4xl text-white">{event.name}</p>
      <p className="mt-3 text-sm text-white/70">{formatDay(event.startAt)} · {event.venue || "NMIET Campus"}</p>
      <p className="mt-4 text-sm" style={{ color: accent }}>Yours after you register</p>
    </div>
  );
}
