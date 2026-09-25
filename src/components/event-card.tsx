import Link from "next/link";
import { formatDay } from "@/lib/format";
import { registrationOpen } from "@/lib/utils";

export type EventCardData = {
  slug: string;
  name: string;
  summary: string;
  coverImage: string | null;
  startAt: Date;
  registrationDeadline: Date;
  category: string;
  registrationMode: string;
  status: string;
  featured: boolean;
  club: { name: string };
  venue: string | null;
};

export function EventVisual({ src, name, className }: { src?: string | null; name: string; className?: string }) {
  if (src) {
    return <img src={src} alt="" className={className} />;
  }
  return (
    <div className={`relative overflow-hidden bg-ink text-white ${className ?? ""}`}>
      <div className="absolute inset-y-8 left-[22%] w-px bg-white/20" />
      <p className="absolute bottom-4 left-4 right-4 text-[11px] font-medium uppercase tracking-[0.2em] text-white/70">{name}</p>
    </div>
  );
}

export function EventCard({ event, layout = "poster" }: { event: EventCardData; layout?: "poster" | "feature" | "row" }) {
  const open = registrationOpen(event);
  if (layout === "feature") {
    return (
      <Link href={`/events/${event.slug}`} className="group grid overflow-hidden bg-ink text-white md:grid-cols-[1.35fr_0.85fr]">
        <EventVisual src={event.coverImage} name={event.name} className="h-72 w-full object-cover transition duration-700 group-hover:scale-[1.03] md:h-[460px]" />
        <div className="flex flex-col justify-end p-6 sm:p-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/60">{event.club.name}</p>
          <h2 className="mt-3 font-display text-5xl text-white sm:text-6xl">{event.name}</h2>
          <p className="mt-4 max-w-md text-[15px] leading-7 text-white/75">{event.summary}</p>
          <p className="mt-6 text-sm text-white/80">{formatDay(event.startAt)} · {open ? "Registration open" : "Registration closed"}</p>
          <span className="mt-6 text-sm font-medium text-accent">Explore event</span>
        </div>
      </Link>
    );
  }
  if (layout === "row") {
    return (
      <Link href={`/events/${event.slug}`} className="group grid grid-cols-[112px_1fr] gap-4 border-b border-line py-4 sm:grid-cols-[180px_1fr_auto] sm:items-center">
        <EventVisual src={event.coverImage} name={event.name} className="h-20 w-full object-cover sm:h-24" />
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{event.club.name} · {event.category}</p>
          <h3 className="mt-1 text-xl font-medium tracking-[-0.03em] group-hover:text-accent">{event.name}</h3>
          <p className="mt-1 line-clamp-1 text-sm text-secondary">{event.summary}</p>
        </div>
        <p className="hidden text-right text-sm text-muted sm:block">
          {formatDay(event.startAt)}
          <span className="mt-1 block">{open ? "Open" : "Closed"}</span>
        </p>
      </Link>
    );
  }
  return (
    <Link href={`/events/${event.slug}`} className="group block min-w-[240px] snap-start">
      <EventVisual src={event.coverImage} name={event.name} className="aspect-[4/5] w-full object-cover transition duration-700 group-hover:scale-[1.03]" />
      <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-muted">{event.club.name}</p>
      <h3 className="mt-1 text-2xl font-medium tracking-[-0.04em]">{event.name}</h3>
      <p className="mt-1 text-sm text-secondary">{formatDay(event.startAt)} · {open ? "Open" : "Closed"} · {event.category}</p>
    </Link>
  );
}
