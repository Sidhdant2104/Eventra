import Link from "next/link";
import { EventMedia } from "@/components/event-card";
import { ButtonLink, EmptyState } from "@/components/ui";
import { prisma } from "@/lib/db";
import { formatDay } from "@/lib/format";
import { requireUser } from "@/lib/permissions";

export const metadata = { title: "My events" };

function label(status: string, ended: boolean, attended: boolean, team: boolean) {
  if (status === "CANCELLED") return "Cancelled";
  if (attended || status === "ATTENDED") return "Checked in";
  if (ended) return "Completed";
  if (team && status === "CONFIRMED") return "Team confirmed";
  if (status === "CONFIRMED") return "Registered";
  if (status === "WAITLISTED") return "Waitlisted";
  return status.replaceAll("_", " ").toLowerCase();
}

export default async function RegistrationsPage({ searchParams }: { searchParams: Promise<{ ready?: string }> }) {
  const user = await requireUser();
  const query = await searchParams;
  const rows = await prisma.registrationParticipant.findMany({
    where: { userId: user.id },
    include: { registration: { include: { event: { include: { club: true } }, team: true, attendance: { where: { userId: user.id } } } }, pass: true },
    orderBy: { createdAt: "desc" },
  });
  const now = new Date();
  const upcoming = rows.filter((row) => row.registration.event.endAt >= now && row.registration.status !== "CANCELLED");
  const past = rows.filter((row) => row.registration.event.endAt < now || row.registration.status === "CANCELLED");

  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Your campus</p>
      <h1 className="mt-2 font-display text-5xl sm:text-6xl">My events</h1>
      {query.ready === "1" ? <p className="mt-4 text-secondary">You&apos;re registered. Open a pass below.</p> : null}
      <Group title="Upcoming" rows={upcoming} userId={user.id} />
      <Group title="Past" rows={past} userId={user.id} />
      {rows.length === 0 ? <div className="mt-8"><EmptyState title="No registrations yet" body="When you register, the pass and status live here. Your profile stays the same for every event." action={<Link className="text-sm font-medium" href="/explore">Find an event</Link>} /></div> : null}
    </div>
  );
}

function Group({ title, rows, userId }: { title: string; userId: string; rows: Array<{
  id: string;
  pass: { id: string } | null;
  registration: {
    code: string;
    status: string;
    team: { name: string } | null;
    attendance: { userId: string }[];
    event: { name: string; slug: string; startAt: Date; endAt: Date; venue: string | null; category: string; coverImage: string | null; club: { name: string } };
  };
}> }) {
  if (rows.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="text-[11px] uppercase tracking-[0.18em] text-muted">{title}</h2>
      <div className="mt-3 space-y-3">
        {rows.map((row) => {
          const event = row.registration.event;
          const attended = row.registration.attendance.some((item) => item.userId === userId);
          const status = label(row.registration.status, event.endAt < new Date(), attended, Boolean(row.registration.team));
          const passHref = row.pass && row.registration.status !== "CANCELLED" && row.registration.status !== "WAITLISTED" ? `/registrations/${row.id}` : null;
          return (
            <article key={row.id} className="grid grid-cols-[92px_1fr] gap-4 border-b border-line py-4 sm:grid-cols-[140px_1fr_auto] sm:items-center">
              <EventMedia src={event.coverImage} name={event.name} category={event.category} className="h-[72px] w-full object-cover sm:h-20" />
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{event.club.name}</p>
                <h3 className="mt-1 truncate text-xl font-medium tracking-[-0.03em]">{event.name}</h3>
                <p className="mt-1 text-sm text-secondary">{formatDay(event.startAt)} · {event.venue || "NMIET"}{row.registration.team ? ` · ${row.registration.team.name}` : ""}</p>
                <p className="mt-1 text-sm">{status}</p>
              </div>
              {passHref ? <ButtonLink href={passHref} size="sm" variant="ink">View pass</ButtonLink> : <Link href={`/events/${event.slug}`} className="self-center text-sm font-medium">Event</Link>}
            </article>
          );
        })}
      </div>
    </section>
  );
}
