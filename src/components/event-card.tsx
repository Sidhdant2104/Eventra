import Link from "next/link";
import { artworkSeed, eventTheme, isPlaceholderCover, type EventTheme } from "@/lib/event-theme";
import { formatDay } from "@/lib/format";
import { registrationOpen } from "@/lib/utils";

export type EventCardData = {
  slug: string;
  name: string;
  summary: string;
  coverImage: string | null;
  startAt: Date | string;
  registrationDeadline: Date | string;
  category: string;
  registrationMode: string;
  status: string;
  featured?: boolean;
  club: { name: string };
  venue: string | null;
};

type Layout = "featured" | "feature" | "large" | "poster" | "compact" | "horizontal" | "row" | "mobile";

export function EventArtwork({ name, category, className }: { name: string; category: string; className?: string }) {
  const theme = eventTheme(category);
  const seed = artworkSeed(`${category}:${name}`);
  const shift = 12 + (seed % 28);
  return (
    <div className={`relative overflow-hidden ${className ?? ""}`} style={{ background: theme.bg, color: theme.fg }} aria-hidden>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">
        {theme.pattern === "grid" ? (
          <>
            {Array.from({ length: 8 }, (_, index) => (
              <line key={`v${index}`} x1={40 + index * 46} y1="0" x2={40 + index * 46} y2="500" stroke={theme.fg} strokeOpacity="0.12" />
            ))}
            {Array.from({ length: 7 }, (_, index) => (
              <line key={`h${index}`} x1="0" y1={50 + index * 64} x2="400" y2={50 + index * 64} stroke={theme.fg} strokeOpacity="0.1" />
            ))}
            <rect x={shift * 4} y={80 + (seed % 40)} width="150" height="220" fill="none" stroke={theme.accent} strokeWidth="1.5" />
          </>
        ) : null}
        {theme.pattern === "bars" ? (
          <>
            {Array.from({ length: 6 }, (_, index) => (
              <rect key={index} x={30 + index * 58} y={40 + ((seed + index * 17) % 80)} width="22" height={280 - index * 18} fill={index % 2 === 0 ? theme.accent : theme.fg} opacity={index % 2 === 0 ? 0.9 : 0.14} />
            ))}
          </>
        ) : null}
        {theme.pattern === "arcs" ? (
          <>
            <circle cx={260 + (seed % 40)} cy="180" r="160" fill="none" stroke={theme.accent} strokeWidth="1.5" />
            <circle cx={260 + (seed % 40)} cy="180" r="100" fill="none" stroke={theme.fg} strokeOpacity="0.25" />
            <circle cx="70" cy="420" r="90" fill={theme.accent} opacity="0.85" />
          </>
        ) : null}
        {theme.pattern === "editorial" ? (
          <>
            <rect x="0" y="0" width={shift * 3} height="500" fill={theme.mood === "light" ? "#161616" : theme.accent} opacity={theme.mood === "light" ? 1 : 0.9} />
            <line x1={shift * 3 + 24} y1="70" x2="370" y2="70" stroke={theme.fg} strokeOpacity="0.35" />
            <line x1={shift * 3 + 24} y1="430" x2="340" y2="430" stroke={theme.fg} strokeOpacity="0.35" />
          </>
        ) : null}
      </svg>
      <p className="absolute bottom-4 left-4 right-4 text-[11px] font-medium uppercase tracking-[0.2em] opacity-70">{category}</p>
    </div>
  );
}

export function EventMedia({ src, name, category, className }: { src?: string | null; name: string; category: string; className?: string }) {
  if (src && !isPlaceholderCover(src)) {
    return <img src={src} alt="" className={`event-card-media ${className ?? ""}`} />;
  }
  return <EventArtwork name={name} category={category} className={className} />;
}

function meta(event: EventCardData, open: boolean) {
  const place = event.venue || "NMIET";
  return `${formatDay(event.startAt)} · ${place} · ${open ? "Registration open" : "Registration closed"}`;
}

export function EventCard({ event, layout = "large" }: { event: EventCardData; layout?: Layout }) {
  const open = registrationOpen(event);
  const theme = eventTheme(event.category);
  const kind = layout === "feature" ? "featured" : layout === "poster" ? "large" : layout === "row" ? "horizontal" : layout;

  if (kind === "featured") {
    return (
      <Link href={`/events/${event.slug}`} className="group grid overflow-hidden bg-surface lg:grid-cols-[1.15fr_0.85fr]">
        <EventMedia src={event.coverImage} name={event.name} category={event.category} className="h-72 w-full object-cover lg:h-full lg:min-h-[440px]" />
        <div className="flex min-h-[280px] flex-col justify-center px-6 py-8 sm:px-8 sm:py-10" style={{ background: theme.bg, color: theme.fg }}>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] opacity-60">Featured · {event.club.name}</p>
          <div>
            <h2 className="font-display text-5xl sm:text-6xl">{event.name}</h2>
            <p className="mt-4 max-w-md text-[15px] leading-7 opacity-80">{event.summary}</p>
            <p className="mt-6 text-sm opacity-80">{meta(event, open)}</p>
            <span className="mt-6 inline-flex text-sm font-medium" style={{ color: theme.accent }}>Explore event →</span>
          </div>
        </div>
      </Link>
    );
  }

  if (kind === "horizontal") {
    return (
      <Link href={`/events/${event.slug}`} className="group grid grid-cols-[104px_1fr] items-center gap-4 border-b border-line py-4 sm:grid-cols-[168px_1fr_auto]">
        <EventMedia src={event.coverImage} name={event.name} category={event.category} className="h-[76px] w-full object-cover sm:h-24" />
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{event.club.name}</p>
          <h3 className="mt-1 truncate text-xl font-medium tracking-[-0.03em] group-hover:translate-x-0.5 transition">{event.name}</h3>
          <p className="mt-1 text-sm text-secondary">{formatDay(event.startAt)} · {event.venue || "NMIET"}</p>
        </div>
        <p className="hidden text-right text-sm sm:block" style={{ color: open ? theme.accent : undefined }}>
          <span className={open ? "" : "text-muted"}>{open ? "Registration open" : "Closed"}</span>
        </p>
      </Link>
    );
  }

  const compact = kind === "compact" || kind === "mobile";
  return (
    <Link href={`/events/${event.slug}`} className={`group block ${compact ? "" : "min-w-[240px]"}`}>
      <EventMedia src={event.coverImage} name={event.name} category={event.category} className={`${compact ? "aspect-[5/4]" : "aspect-[4/5]"} w-full object-cover`} />
      <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-muted">{event.club.name}</p>
      <h3 className={`mt-1 font-medium tracking-[-0.04em] ${compact ? "text-xl" : "text-2xl"}`}>{event.name}</h3>
      <p className="mt-1 text-sm text-secondary">{formatDay(event.startAt)} · {event.venue || "NMIET"}</p>
      <p className="mt-1 text-[13px]" style={{ color: open ? theme.accent : undefined }}>
        <span className={open ? "" : "text-muted"}>{open ? "Registration open" : "Registration closed"}</span>
      </p>
    </Link>
  );
}

export function themeFor(category: string): EventTheme {
  return eventTheme(category);
}
