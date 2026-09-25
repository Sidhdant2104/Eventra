import Link from "next/link";
import { EventCard } from "@/components/event-card";
import { EmptyState } from "@/components/ui";
import { prisma } from "@/lib/db";

export const metadata = { title: "Explore" };

export default async function ExplorePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const events = await prisma.event.findMany({
    where: {
      status: "PUBLISHED",
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { summary: { contains: q, mode: "insensitive" } }, { club: { name: { contains: q, mode: "insensitive" } } }] } : {}),
      ...(params.category ? { category: params.category } : {}),
      ...(params.club ? { club: { slug: params.club } } : {}),
      ...(params.featured === "1" ? { featured: true } : {}),
      ...(params.when === "upcoming" ? { endAt: { gte: new Date() } } : {}),
      ...(params.registration === "open" ? { registrationDeadline: { gt: new Date() } } : {}),
      ...(params.registration === "closed" ? { registrationDeadline: { lte: new Date() } } : {}),
    },
    include: { club: true },
    orderBy: [{ featured: "desc" }, { startAt: "asc" }],
  });
  const [categories, clubs] = await Promise.all([
    prisma.event.findMany({ where: { status: "PUBLISHED" }, select: { category: true }, distinct: ["category"] }),
    prisma.club.findMany({ orderBy: { name: "asc" } }),
  ]);
  const filtered = Boolean(q || params.category || params.club || params.featured || params.when || params.registration);
  const featured = !filtered ? events.find((event) => event.featured) ?? events[0] : null;
  const rest = featured ? events.filter((event) => event.id !== featured.id) : events;
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">Discover</p>
      <h1 className="mt-2 max-w-3xl font-display text-5xl sm:text-7xl">Events across NMIET.</h1>
      <form className="mt-8 space-y-4">
        <input name="q" defaultValue={q} placeholder="Search events, clubs, workshops..." aria-label="Search events" className="h-14 w-full max-w-2xl border-b border-ink bg-transparent text-lg outline-none placeholder:text-muted" />
        <div className="flex flex-wrap gap-2 text-sm">
          <FilterSelect name="category" label="Category" value={params.category ?? ""} options={categories.map((item) => ({ value: item.category, label: item.category }))} />
          <FilterSelect name="club" label="Club" value={params.club ?? ""} options={clubs.map((club) => ({ value: club.slug, label: club.name }))} />
          <FilterSelect name="registration" label="Registration" value={params.registration ?? ""} options={[{ value: "open", label: "Open" }, { value: "closed", label: "Closed" }]} />
          <FilterSelect name="when" label="When" value={params.when ?? ""} options={[{ value: "upcoming", label: "Upcoming" }]} />
          <label className="flex items-center gap-2 px-2 text-secondary"><input type="checkbox" name="featured" value="1" defaultChecked={params.featured === "1"} /> Featured</label>
          <button className="bg-ink px-4 py-2 text-sm font-medium text-white" type="submit">Apply</button>
          {filtered ? <Link href="/explore" className="px-2 py-2 text-muted">Clear</Link> : null}
        </div>
      </form>

      {featured ? (
        <div className="mt-10">
          <EventCard event={featured} layout="feature" />
        </div>
      ) : null}

      {rest.length > 0 ? (
        <div className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {rest.slice(0, 3).map((event) => <EventCard key={event.id} event={event} />)}
        </div>
      ) : null}
      {rest.length > 3 ? (
        <div className="mt-12">
          <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-muted">Also on campus</p>
          {rest.slice(3).map((event) => <EventCard key={event.id} event={event} layout="row" />)}
        </div>
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
