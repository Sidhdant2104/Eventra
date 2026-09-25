import Link from "next/link";
import { EventCard } from "@/components/event-card";
import { Logo } from "@/components/logo";
import { ButtonLink } from "@/components/ui";
import { prisma } from "@/lib/db";

export default async function HomePage() {
  const [events, clubs] = await Promise.all([
    prisma.event.findMany({ where: { status: "PUBLISHED" }, include: { club: true }, orderBy: [{ featured: "desc" }, { startAt: "asc" }], take: 4 }),
    prisma.club.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { events: true } } } }),
  ]);
  const [featured, ...rest] = events;
  return (
    <div>
      <header className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/explore" className="text-muted hover:text-ink">Explore</Link>
          <Link href="/login" className="bg-ink px-4 py-2 text-white">Sign in</Link>
        </nav>
      </header>
      <main id="content">
        <section className="mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6 sm:pt-16">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted">NMIET One</p>
          <h1 className="mt-4 max-w-4xl font-display text-5xl text-ink sm:text-7xl lg:text-8xl">One profile. Every event. One campus.</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-secondary">The event ecosystem for NMIET clubs and committees. Register once, carry a pass, and keep every certificate in the same account.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/register" size="lg">Create your profile</ButtonLink>
            <ButtonLink href="/explore" variant="outline" size="lg">Browse events</ButtonLink>
          </div>
        </section>
        {featured ? (
          <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.18em] text-muted">Featured</p>
            <EventCard event={featured} layout="feature" />
          </section>
        ) : null}
        {rest.length > 0 ? (
          <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
            <div className="mb-6 flex items-end justify-between">
              <h2 className="font-display text-4xl sm:text-5xl">Coming up</h2>
              <Link href="/explore" className="text-sm font-medium">See all</Link>
            </div>
            <div className="grid gap-8 sm:grid-cols-3">
              {rest.map((event) => <EventCard key={event.id} event={event} />)}
            </div>
          </section>
        ) : null}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <h2 className="font-display text-4xl sm:text-5xl">Clubs</h2>
          <div className="mt-8 divide-y divide-line border-y border-line">
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
