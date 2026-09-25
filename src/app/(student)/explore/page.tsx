import Link from "next/link";
import { EventCard } from "@/components/event-card";
import { EmptyState } from "@/components/ui";
import { EVENT_CATEGORIES } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/permissions";

export const metadata = { title: "Explore" };

export default async function ExplorePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const user = await getCurrentUser();
  const now = new Date();
  const events = await prisma.event.findMany({
    where: {
      status: "PUBLISHED",
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { summary: { contains: q, mode: "insensitive" } }, { club: { name: { contains: q, mode: "insensitive" } } }] } : {}),
      ...(params.category ? { category: params.category } : {}),
      ...(params.club ? { club: { slug: params.club } } : {}),
      ...(params.featured === "1" ? { featured: true } : {}),
      ...(params.when === "upcoming" ? { endAt: { gte: now } } : {}),
      ...(params.registration === "open" ? { registrationDeadline: { gt: now } } : {}),
      ...(params.registration === "closed" ? { registrationDeadline: { lte: now } } : {}),
    },
    include: { club: true },
    orderBy: [{ featured: "desc" }, { startAt: "asc" }],
  });
  const [categories, clubs, history] = await Promise.all([
    prisma.event.findMany({ where: { status: "PUBLISHED" }, select: { category: true }, distinct: ["category"] }),
    prisma.club.findMany({ orderBy: { name: "asc" } }),
    user ? prisma.registrationParticipant.findMany({ where: { userId: user.id }, include: { registration: { include: { event: true } } }, take: 12 }) : Promise.resolve([]),
  ]);
  const filtered = Boolean(q || params.category || params.club || params.featured || params.when || params.registration);
  const featured = !filtered ? events.find((event) => event.featured) ?? events[0] : events[0];
  const used = new Set<string>();
  if (!filtered && featured) used.add(featured.id);
  const side = !filtered ? events.filter((event) => !used.has(event.id)).slice(0, 2) : [];
  side.forEach((event) => used.add(event.id));
  const soonCutoff = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const closing = !filtered ? events.filter((event) => !used.has(event.id) && event.registrationDeadline > now && event.registrationDeadline <= soonCutoff) : [];
  closing.forEach((event) => used.add(event.id));
  const upcoming = !filtered ? events.filter((event) => !used.has(event.id) && event.endAt >= now) : [];
  upcoming.forEach((event) => used.add(event.id));
  const known = new Set(history.map((row) => row.registration.event.category));
  const forYou = !filtered && known.size > 0 ? events.filter((event) => known.has(event.category) && event.id !== featured?.id).slice(0, 3) : [];
  const rest = filtered ? events.slice(featured ? 1 : 0) : events.filter((event) => !used.has(event.id));

  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">Discover</p>
      <h1 className="mt-2 max-w-3xl font-display text-4xl sm:text-6xl">What&apos;s happening across campus.</h1>
      <form action="/explore" className="mt-6">
        <label className="sr-only" htmlFor="explore-q">Search events</label>
        <input id="explore-q" name="q" defaultValue={q} placeholder="Search events, clubs, workshops..." className="h-12 w-full max-w-2xl border-b border-ink bg-transparent text-lg outline-none placeholder:text-muted" />
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <FilterSelect name="category" label="Category" value={params.category ?? ""} options={categories.map((item) => ({ value: item.category, label: item.category }))} />
          <FilterSelect name="club" label="Club" value={params.club ?? ""} options={clubs.map((club) => ({ value: club.slug, label: club.name }))} />
          <FilterSelect name="registration" label="Registration" value={params.registration ?? ""} options={[{ value: "open", label: "Open" }, { value: "closed", label: "Closed" }]} />
          <FilterSelect name="when" label="When" value={params.when ?? ""} options={[{ value: "upcoming", label: "Upcoming" }]} />
          <label className="flex items-center gap-2 px-2 text-secondary"><input type="checkbox" name="featured" value="1" defaultChecked={params.featured === "1"} /> Featured</label>
          <button className="bg-ink px-4 py-2 text-sm font-medium text-white" type="submit">Apply</button>
          {filtered ? <Link href="/explore" className="px-2 py-2 text-muted">Clear</Link> : null}
        </div>
      </form>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {EVENT_CATEGORIES.map((category) => {
          const active = params.category === category;
          return (
            <Link key={category} href={active ? "/explore" : `/explore?category=${encodeURIComponent(category)}`} className={`shrink-0 border px-3 py-1.5 text-sm ${active ? "border-ink bg-ink text-white" : "border-line text-secondary hover:border-ink"}`}>
              {category}
            </Link>
          );
        })}
      </div>

      {!filtered && featured ? (
        <section className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_0.7fr]">
          <EventCard event={featured} layout="featured" />
          <div className="grid content-start gap-6">
            {side.map((event) => <EventCard key={event.id} event={event} layout="compact" />)}
          </div>
        </section>
      ) : null}

      {filtered && featured ? (
        <div className="mt-10"><EventCard event={featured} layout="featured" /></div>
      ) : null}

      {forYou.length > 0 ? (
        <section className="mt-14">
          <h2 className="font-display text-4xl">For you</h2>
          <p className="mt-2 text-sm text-secondary">Based on events you have already joined.</p>
          <div className="mt-5 grid gap-6 sm:grid-cols-3">
            {forYou.map((event) => <EventCard key={event.id} event={event} layout="compact" />)}
          </div>
        </section>
      ) : null}

      {upcoming.length > 0 ? (
        <section className="mt-14">
          <h2 className="font-display text-4xl">Upcoming</h2>
          <div className="mt-5 -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            {upcoming.map((event) => <div key={event.id} className="w-[70vw] max-w-[260px] shrink-0"><EventCard event={event} layout="mobile" /></div>)}
          </div>
        </section>
      ) : null}

      {closing.length > 0 ? (
        <section className="mt-14">
          <h2 className="font-display text-4xl">Closing soon</h2>
          <div className="mt-2">
            {closing.map((event) => <EventCard key={event.id} event={event} layout="horizontal" />)}
          </div>
        </section>
      ) : null}

      {rest.length > 0 ? (
        <section className="mt-14">
          <h2 className="mb-2 font-display text-4xl">{filtered ? "Results" : "More events"}</h2>
          {rest.map((event) => <EventCard key={event.id} event={event} layout="horizontal" />)}
        </section>
      ) : null}

      {events.length === 0 ? (
        <div className="mt-10">
          <EmptyState title="No events match" body="Try another club or category, or clear the filters and start from the full campus list." action={<Link className="text-sm font-medium" href="/explore">Clear filters</Link>} />
        </div>
      ) : null}
    </div>
  );
}

function FilterSelect({ name, label, value, options }: { name: string; label: string; value: string; options: { value: string; label: string }[] }) {
  return (
    <select name={name} defaultValue={value} aria-label={label} className="h-10 border border-line bg-surface px-3 text-sm">
      <option value="">{label}</option>
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  );
}
