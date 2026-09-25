import Link from "next/link";
import { EventVisual } from "@/components/event-card";
import { Logo } from "@/components/logo";
import { ButtonLink } from "@/components/ui";
import { formatDay, formatWhen } from "@/lib/format";
import { registrationOpen, youtubeEmbed } from "@/lib/utils";

type Section = { id: string; type: string; visible: boolean; content: unknown };
type EventModel = {
  name: string;
  slug: string;
  summary: string;
  coverImage: string | null;
  startAt: Date | string;
  endAt: Date | string;
  registrationDeadline: Date | string;
  venue: string | null;
  mode: string;
  category: string;
  registrationMode: string;
  status: string;
  club: { name: string };
  sections: Section[];
};

function record(content: unknown) {
  return content && typeof content === "object" ? (content as Record<string, unknown>) : {};
}
function text(value: unknown) {
  return typeof value === "string" ? value : "";
}
function rows(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object") : [];
}

function Paragraphs({ value, large = false }: { value: string; large?: boolean }) {
  if (!value) return null;
  return (
    <div className={large ? "space-y-5 text-[17px] leading-8 text-secondary sm:text-lg" : "space-y-4 text-[16px] leading-7 text-secondary"}>
      {value.split(/\n{2,}/).map((paragraph, index) => (
        <p key={index}>
          {paragraph.split("\n").map((line, lineIndex) => (
            <span key={lineIndex}>{lineIndex > 0 ? <br /> : null}{line}</span>
          ))}
        </p>
      ))}
    </div>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">{children}</p>;
}

export function EventPageView({
  event,
  loggedIn,
  participantId,
  draft,
  preview = false,
}: {
  event: EventModel;
  loggedIn: boolean;
  participantId?: string | null;
  draft?: boolean;
  preview?: boolean;
}) {
  const open = registrationOpen(event);
  const registerHref = participantId
    ? `/registrations/${participantId}`
    : !loggedIn
      ? `/login?callbackUrl=${encodeURIComponent(event.registrationMode === "TEAM" ? `/events/${event.slug}/team/new` : `/events/${event.slug}/register`)}`
      : event.registrationMode === "TEAM"
        ? `/events/${event.slug}/team/new`
        : `/events/${event.slug}/register`;
  const cta = participantId ? "View pass" : open ? "Register now" : "Registration closed";
  const canAct = Boolean(participantId) || open;

  return (
    <div className="bg-background text-ink">
      {preview ? null : (
        <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/90 text-white backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
            <Logo light href="/" />
            <p className="hidden truncate text-sm text-white/60 sm:block">{event.name}</p>
            <ButtonLink href={registerHref} size="sm" variant={canAct ? "primary" : "outline"} className={canAct ? "" : "pointer-events-none opacity-50"}>
              {cta}
            </ButtonLink>
          </div>
        </header>
      )}
      {draft ? <div className="bg-[#fff4df] px-4 py-2 text-center text-sm text-warn">Draft preview. Students cannot see this page until it is published.</div> : null}
      <main id={preview ? undefined : "content"}>
        {event.sections.filter((section) => section.visible).map((section) => (
          <Block key={section.id} section={section} event={event} registerHref={registerHref} cta={cta} open={canAct} />
        ))}
      </main>
      {preview ? null : (
        <>
          <footer className="border-t border-line px-4 py-12 text-sm text-muted">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
              <p>{event.club.name} · NMIET One</p>
              <Link href="/explore" className="font-medium text-ink">More events</Link>
            </div>
          </footer>
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-background/95 p-3 backdrop-blur md:hidden">
            <ButtonLink href={registerHref} className={`w-full ${canAct ? "" : "pointer-events-none opacity-50"}`}>{cta}</ButtonLink>
          </div>
        </>
      )}
    </div>
  );
}

function Block({ section, event, registerHref, cta, open }: { section: Section; event: EventModel; registerHref: string; cta: string; open: boolean }) {
  const data = record(section.content);
  if (section.type === "HERO") {
    const image = text(data.image) || event.coverImage || "";
    return (
      <section className="relative min-h-[88vh] overflow-hidden bg-ink text-white">
        <EventVisual src={image} name={event.name} className="hero-media absolute inset-0 h-full w-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/10" />
        <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-end px-4 pb-16 pt-28 sm:px-6">
          <p className="rise text-[12px] font-medium uppercase tracking-[0.22em] text-white/70">{text(data.eyebrow) || event.club.name}</p>
          <h1 className="rise rise-delay mt-4 max-w-5xl font-display text-[12vw] text-white sm:text-7xl lg:text-8xl">{text(data.title) || event.name}</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/80">{text(data.subtitle) || event.summary}</p>
          <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
            <dl className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
              <div><dt className="text-[11px] uppercase tracking-[0.16em] text-white/45">When</dt><dd className="mt-1">{formatWhen(event.startAt)}</dd></div>
              <div><dt className="text-[11px] uppercase tracking-[0.16em] text-white/45">Where</dt><dd className="mt-1">{event.venue || event.mode.toLowerCase()}</dd></div>
              <div><dt className="text-[11px] uppercase tracking-[0.16em] text-white/45">Register by</dt><dd className="mt-1">{formatDay(event.registrationDeadline)}</dd></div>
            </dl>
            {open ? <ButtonLink href={registerHref} size="lg" className="w-full sm:w-auto">{cta}</ButtonLink> : null}
          </div>
        </div>
      </section>
    );
  }
  if (section.type === "ABOUT") {
    return (
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 md:grid-cols-[0.9fr_1.1fr] md:items-end md:py-28">
        <div>
          <Kicker>{event.category}</Kicker>
          <h2 className="mt-3 font-display text-5xl sm:text-6xl">{text(data.heading) || "About the event"}</h2>
        </div>
        <div>
          <Paragraphs value={text(data.body)} large />
          {text(data.image) ? <img src={text(data.image)} alt="" className="mt-8 aspect-[16/10] w-full object-cover" /> : null}
        </div>
      </section>
    );
  }
  if (section.type === "RICH_TEXT") {
    return (
      <section className="border-t border-line px-4 py-20 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[0.7fr_1.3fr]">
          <h2 className="font-display text-4xl sm:text-5xl">{text(data.heading)}</h2>
          <Paragraphs value={text(data.body)} large />
        </div>
      </section>
    );
  }
  if (section.type === "IMAGE" && text(data.url)) {
    return (
      <figure className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <img src={text(data.url)} alt={text(data.alt)} className="w-full object-cover" />
        {text(data.caption) ? <figcaption className="mt-3 text-sm text-muted">{text(data.caption)}</figcaption> : null}
      </figure>
    );
  }
  if (section.type === "GALLERY") {
    const images = rows(data.images).filter((image) => text(image.url));
    if (images.length === 0) return null;
    return (
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Kicker>Gallery</Kicker>
        <h2 className="mt-3 font-display text-5xl">{text(data.heading) || "From the floor"}</h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-12">
          {images.map((image, index) => (
            <img key={index} src={text(image.url)} alt={text(image.alt)} className={`w-full object-cover ${index === 0 ? "aspect-[16/10] sm:col-span-8" : "aspect-[4/3] sm:col-span-4"}`} />
          ))}
        </div>
      </section>
    );
  }
  if (section.type === "VIDEO") {
    const embed = youtubeEmbed(text(data.url));
    return (
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-5xl">{text(data.heading) || "Watch"}</h2>
        {embed ? <iframe className="mt-6 aspect-video w-full" src={embed} title={text(data.heading) || "Event video"} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /> : text(data.url) ? <a className="mt-4 inline-block font-medium" href={text(data.url)}>Watch video</a> : null}
        {text(data.caption) ? <p className="mt-3 text-sm text-muted">{text(data.caption)}</p> : null}
      </section>
    );
  }
  if (section.type === "SPEAKERS" || section.type === "ORGANIZERS") {
    const people = rows(data.people).filter((person) => text(person.name));
    if (people.length === 0) return null;
    return (
      <section className="border-t border-line px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <Kicker>{section.type === "SPEAKERS" ? "People" : "Organizers"}</Kicker>
          <h2 className="mt-3 font-display text-5xl">{text(data.heading)}</h2>
          <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {people.map((person, index) => (
              <article key={index}>
                {text(person.image) ? <img src={text(person.image)} alt="" className="mb-4 aspect-[4/5] w-full object-cover" /> : <div className="mb-4 grid aspect-[4/5] place-items-end bg-ink p-4 text-white"><span className="font-display text-7xl">{text(person.name).slice(0, 1)}</span></div>}
                <h3 className="text-2xl font-medium tracking-[-0.03em]">{text(person.name)}</h3>
                <p className="mt-1 text-sm text-accent">{text(person.role)}</p>
                {text(person.bio) ? <p className="mt-3 text-sm leading-6 text-secondary">{text(person.bio)}</p> : null}
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }
  if (section.type === "TIMELINE") {
    const items = rows(data.items).filter((item) => text(item.title));
    if (items.length === 0) return null;
    return (
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Kicker>Schedule</Kicker>
        <h2 className="mt-3 font-display text-5xl">{text(data.heading) || "Timeline"}</h2>
        <ol className="mt-10">
          {items.map((item, index) => (
            <li key={index} className="grid gap-2 border-t border-line py-6 sm:grid-cols-[140px_1fr] sm:gap-10">
              <p className="text-sm font-medium text-accent">{text(item.time) || String(index + 1).padStart(2, "0")}</p>
              <div>
                <h3 className="text-2xl font-medium tracking-[-0.03em]">{text(item.title)}</h3>
                <p className="mt-2 max-w-xl text-[15px] leading-7 text-secondary">{text(item.description)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    );
  }
  if (section.type === "PRIZES") {
    const prizes = rows(data.prizes).filter((prize) => text(prize.title) || text(prize.reward));
    if (prizes.length === 0) return null;
    const [first, ...rest] = prizes;
    return (
      <section className="bg-ink px-4 py-20 text-white sm:px-6">
        <div className="mx-auto max-w-6xl">
          <Kicker><span className="text-white/50">Prizes</span></Kicker>
          <h2 className="mt-3 font-display text-5xl">{text(data.heading) || "What you can win"}</h2>
          {first ? (
            <article className="mt-12 border-t border-white/15 pt-8">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/50">{text(first.place) || "Grand prize"}</p>
              <p className="mt-3 font-display text-6xl text-white sm:text-8xl">{text(first.reward)}</p>
              <h3 className="mt-3 text-2xl">{text(first.title)}</h3>
              <p className="mt-2 max-w-lg text-white/70">{text(first.description)}</p>
            </article>
          ) : null}
          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            {rest.map((prize, index) => (
              <article key={index} className="border-t border-white/15 pt-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">{text(prize.place)}</p>
                <p className="mt-2 font-display text-4xl">{text(prize.reward)}</p>
                <h3 className="mt-2 text-lg">{text(prize.title)}</h3>
                <p className="mt-2 text-sm text-white/65">{text(prize.description)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }
  if (section.type === "RULES") {
    const rules = Array.isArray(data.rules) ? data.rules.map((rule) => text(rule)).filter(Boolean) : [];
    if (rules.length === 0) return null;
    return (
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Kicker>Before you enter</Kicker>
        <h2 className="mt-3 font-display text-5xl">{text(data.heading) || "Rules"}</h2>
        <ol className="mt-10 max-w-3xl">
          {rules.map((rule, index) => (
            <li key={index} className="grid grid-cols-[2.5rem_1fr] gap-3 border-t border-line py-4 text-[15px] leading-7">
              <span className="text-sm text-muted">{String(index + 1).padStart(2, "0")}</span>
              <span>{rule}</span>
            </li>
          ))}
        </ol>
      </section>
    );
  }
  if (section.type === "FAQS") {
    const faqs = rows(data.items).filter((item) => text(item.question));
    if (faqs.length === 0) return null;
    return (
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <h2 className="font-display text-5xl">{text(data.heading) || "Questions"}</h2>
        <div className="mt-8">
          {faqs.map((item, index) => (
            <details key={index} className="group border-t border-line py-5">
              <summary className="cursor-pointer list-none text-xl font-medium tracking-[-0.03em]">{text(item.question)}</summary>
              <p className="mt-3 max-w-xl text-[15px] leading-7 text-secondary">{text(item.answer)}</p>
            </details>
          ))}
        </div>
      </section>
    );
  }
  if (section.type === "SPONSORS") {
    const sponsors = rows(data.sponsors).filter((sponsor) => text(sponsor.name));
    if (sponsors.length === 0) return null;
    return (
      <section className="border-t border-line px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <Kicker>{text(data.heading) || "With"}</Kicker>
          <ul className="mt-6 flex flex-wrap gap-x-10 gap-y-4">
            {sponsors.map((sponsor, index) => (
              <li key={index} className="text-lg font-medium tracking-[-0.03em]">
                {text(sponsor.logo) ? <img src={text(sponsor.logo)} alt={text(sponsor.name)} className="h-8" /> : text(sponsor.name)}
                {text(sponsor.tier) ? <span className="ml-2 text-xs uppercase tracking-[0.14em] text-muted">{text(sponsor.tier)}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  }
  if (section.type === "CONTACT") {
    return (
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:px-6 md:grid-cols-2">
        <h2 className="font-display text-5xl">{text(data.heading) || "Contact"}</h2>
        <div>
          <Paragraphs value={text(data.note)} />
          <dl className="mt-6 space-y-3 text-sm">
            {text(data.email) ? <div><dt className="text-muted">Email</dt><dd><a className="font-medium" href={`mailto:${text(data.email)}`}>{text(data.email)}</a></dd></div> : null}
            {text(data.phone) ? <div><dt className="text-muted">Phone</dt><dd>{text(data.phone)}</dd></div> : null}
            {text(data.location) ? <div><dt className="text-muted">Location</dt><dd>{text(data.location)}</dd></div> : null}
          </dl>
        </div>
      </section>
    );
  }
  if (section.type === "REGISTRATION_CTA") {
    return (
      <section className="bg-ink px-4 py-20 text-white sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <h2 className="max-w-xl font-display text-5xl sm:text-7xl">{text(data.heading) || "Register now"}</h2>
            <p className="mt-4 max-w-md text-white/70">{text(data.body) || "Your NMIET profile is already on file."}</p>
          </div>
          <div>
            {open ? <ButtonLink href={registerHref} size="lg">{text(data.buttonLabel) || cta}</ButtonLink> : <p className="text-sm text-white/60">Registration is closed.</p>}
            {event.registrationMode !== "SOLO" ? <p className="mt-4 text-sm"><Link className="underline" href={loggedInHref(event.slug, registerHref)}>Team registration is available.</Link></p> : null}
          </div>
        </div>
      </section>
    );
  }
  return null;
}

function loggedInHref(slug: string, fallback: string) {
  if (fallback.includes("/team")) return fallback;
  return `/events/${slug}/team/new`;
}
