import Link from "next/link";
import { AdminChart } from "@/components/admin-chart";
import { prisma } from "@/lib/db";
import { formatWhen } from "@/lib/format";
import { requireAdmin } from "@/lib/permissions";

export const metadata = { title: "Overview" };

function greeting() {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "numeric", hourCycle: "h23" }).format(new Date()));
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function AdminHome() {
  const user = await requireAdmin();
  const [events, upcomingEvents, registrations, attendance, certificates, recent, grouped, announcements] = await Promise.all([
    prisma.event.count(),
    prisma.event.findMany({ where: { status: "PUBLISHED", startAt: { gte: new Date() } }, include: { club: true }, orderBy: { startAt: "asc" }, take: 4 }),
    prisma.registration.count({ where: { status: { not: "CANCELLED" } } }),
    prisma.attendance.count(),
    prisma.certificate.count({ where: { revokedAt: null } }),
    prisma.registration.findMany({ include: { event: true, user: true, team: true }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.event.findMany({ include: { _count: { select: { participants: true } } }, orderBy: { startAt: "asc" } }),
    prisma.announcement.findMany({ include: { event: true }, orderBy: { createdAt: "desc" }, take: 4 }),
  ]);
  const metrics = [
    ["Events", events, "/admin/events"],
    ["Registrations", registrations, "/admin/events"],
    ["Attendance", attendance, "/admin/events"],
    ["Certificates", certificates, "/admin/events"],
  ] as const;
  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">{greeting()}</p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl">{user.name.split(" ")[0]}.</h1>
        <p className="mt-2 text-sm text-secondary">Campus activity across clubs you can manage.</p>
      </div>
      <div className="grid border border-line bg-surface sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value, href]) => (
          <Link key={label} href={href} className="border-b border-line px-5 py-4 last:border-b-0 hover:bg-background sm:border-b-0 sm:border-r sm:last:border-r-0">
            <p className="text-[12px] text-muted">{label}</p>
            <p className="mt-2 font-display text-4xl">{value}</p>
          </Link>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="border border-line bg-surface p-5">
          <h2 className="text-sm font-medium">Registrations by event</h2>
          <div className="mt-4">
            <AdminChart data={grouped.map((event) => ({ name: event.name.split(" ")[0] ?? event.name, registrations: event._count.participants }))} />
          </div>
        </section>
        <section className="border border-line bg-surface p-5">
          <h2 className="text-sm font-medium">Upcoming events</h2>
          <ul className="mt-3">
            {upcomingEvents.map((event) => (
              <li key={event.id} className="border-t border-line py-3 text-sm">
                <Link href={`/admin/events/${event.id}`} className="font-medium">{event.name}</Link>
                <p className="text-muted">{event.club.name} · {formatWhen(event.startAt)}</p>
              </li>
            ))}
            {upcomingEvents.length === 0 ? <li className="pt-3 text-sm text-muted">No upcoming published events.</li> : null}
          </ul>
        </section>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="border border-line bg-surface p-5">
          <h2 className="text-sm font-medium">Recent registrations</h2>
          <ul className="mt-3 text-sm">
            {recent.map((row) => (
              <li key={row.id} className="flex justify-between gap-3 border-t border-line py-3">
                <span>{row.user?.name ?? row.team?.name} · {row.event.name}</span>
                <span className="text-muted">{row.code}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="border border-line bg-surface p-5">
          <h2 className="text-sm font-medium">Recent activity</h2>
          <ul className="mt-3 text-sm">
            {announcements.map((item) => (
              <li key={item.id} className="border-t border-line py-3">
                <p className="font-medium">{item.title}</p>
                <p className="text-muted">{item.event.name} · {formatWhen(item.createdAt)}</p>
              </li>
            ))}
            {announcements.length === 0 ? <li className="pt-3 text-muted">Announcements from events will show up here.</li> : null}
          </ul>
        </section>
      </div>
    </div>
  );
}
