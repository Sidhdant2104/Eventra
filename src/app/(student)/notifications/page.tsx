import Link from "next/link";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions/notifications";
import { EmptyState } from "@/components/ui";
import { prisma } from "@/lib/db";
import { formatWhen } from "@/lib/format";
import { requireUser } from "@/lib/permissions";

export const metadata = { title: "Notifications" };

function dayKey(value: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(value);
}

function isToday(value: Date) {
  return dayKey(value) === dayKey(new Date());
}

export default async function NotificationsPage() {
  const user = await requireUser();
  const notes = await prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 });
  const today = notes.filter((note) => isToday(note.createdAt));
  const earlier = notes.filter((note) => !isToday(note.createdAt));
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Inbox</p>
          <h1 className="mt-2 font-display text-5xl sm:text-6xl">Notifications</h1>
        </div>
        <form action={markAllNotificationsRead}><button className="text-sm font-medium" type="submit">Mark all read</button></form>
      </div>
      <Group label="Today" notes={today} />
      <Group label="Earlier" notes={earlier} />
      {notes.length === 0 ? <div className="mt-8"><EmptyState title="You're caught up" body="Registrations, team invites, event updates, and certificates will collect here." /></div> : null}
    </div>
  );
}

function Group({ label, notes }: { label: string; notes: { id: string; title: string; body: string; href: string | null; createdAt: Date; readAt: Date | null }[] }) {
  if (notes.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="text-[11px] uppercase tracking-[0.18em] text-muted">{label}</h2>
      <ul className="mt-3">
        {notes.map((note) => (
          <li key={note.id} className={`border-t border-line py-4 ${note.readAt ? "" : "bg-surface"}`}>
            <div className="flex items-start justify-between gap-4 px-1">
              <div>
                <p className="flex items-center gap-2 font-medium">
                  {!note.readAt ? <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden /> : null}
                  {note.title}
                </p>
                <p className="mt-1 max-w-xl text-sm leading-6 text-secondary">{note.body}</p>
                <p className="mt-2 text-xs text-muted">{formatWhen(note.createdAt)}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2 text-sm">
                {note.href ? <Link className="font-medium" href={note.href}>Open</Link> : null}
                {!note.readAt ? (
                  <form action={markNotificationRead.bind(null, note.id)}><button className="text-muted" type="submit">Mark read</button></form>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
