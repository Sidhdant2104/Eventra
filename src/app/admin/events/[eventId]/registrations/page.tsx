import Link from "next/link";
import { StatusSelect } from "@/components/status-select";
import { Avatar, EmptyState, Input, Select } from "@/components/ui";
import { prisma } from "@/lib/db";
import { formatWhen, yearLabel } from "@/lib/format";
import { requireEventAccess } from "@/lib/permissions";

const PAGE_SIZE = 12;

export default async function RegistrationsAdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ q?: string; status?: string; sort?: string; page?: string }>;
}) {
  const { eventId } = await params;
  await requireEventAccess(eventId, ["full", "manage"]);
  const query = await searchParams;
  const q = query.q?.trim() ?? "";
  const page = Math.max(1, Number(query.page) || 1);
  const rows = await prisma.registration.findMany({
    where: {
      eventId,
      ...(query.status ? { status: query.status as "CONFIRMED" } : {}),
      ...(q ? { OR: [{ code: { contains: q, mode: "insensitive" } }, { user: { name: { contains: q, mode: "insensitive" } } }, { team: { name: { contains: q, mode: "insensitive" } } }] } : {}),
    },
    include: { user: { include: { profile: true } }, team: true, attendance: true, participants: { include: { user: { include: { profile: true } } } } },
    orderBy: query.sort === "name" ? { user: { name: "asc" } } : { createdAt: "desc" },
  });
  const people = rows.flatMap((row) => {
    const members = row.participants.length ? row.participants.map((participant) => participant.user) : row.user ? [row.user] : [];
    return members.map((person) => ({ row, person }));
  });
  const pageCount = Math.max(1, Math.ceil(people.length / PAGE_SIZE));
  const visible = people.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const queryBase = new URLSearchParams();
  if (q) queryBase.set("q", q);
  if (query.status) queryBase.set("status", query.status);
  if (query.sort) queryBase.set("sort", query.sort);

  return (
    <div>
      <form className="mb-4 flex flex-wrap items-center gap-2">
        <Input name="q" defaultValue={q} placeholder="Search participant, team, ID" aria-label="Search registrations" className="max-w-xs" />
        <Select name="status" defaultValue={query.status ?? ""} aria-label="Status filter">
          <option value="">All statuses</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="WAITLISTED">Waitlisted</option>
          <option value="ATTENDED">Attended</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
        <Select name="sort" defaultValue={query.sort ?? "recent"} aria-label="Sort">
          <option value="recent">Newest</option>
          <option value="name">Name</option>
        </Select>
        <button className="h-11 bg-ink px-4 text-sm font-medium text-white" type="submit">Filter</button>
        <Link className="ml-auto text-sm font-medium" href={`/api/events/${eventId}/export`}>Export CSV</Link>
      </form>
      {people.length === 0 ? (
        <EmptyState title="No one has registered yet" body="Share your event page and watch the list grow. Department, team, and check-in time will show up here." />
      ) : (
        <div className="overflow-x-auto border border-line bg-surface">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Participant</th>
                <th className="py-3 font-medium">Registration</th>
                <th className="py-3 font-medium">Department</th>
                <th className="py-3 font-medium">Year</th>
                <th className="py-3 font-medium">Team</th>
                <th className="py-3 font-medium">Status</th>
                <th className="py-3 font-medium">Attendance</th>
                <th className="py-3 pr-4 font-medium">Registered</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(({ row, person }) => {
                const checked = row.attendance.find((item) => item.userId === person.id);
                return (
                  <tr key={`${row.id}-${person.id}`} className="border-t border-line">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={person.name} />
                        <div>
                          <p className="font-medium">{person.name}</p>
                          <p className="text-xs text-muted">{person.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">{row.code}</td>
                    <td className="py-3">{person.profile?.department ?? "—"}</td>
                    <td className="py-3">{yearLabel(person.profile?.year)}</td>
                    <td className="py-3">{row.team?.name ?? "—"}</td>
                    <td className="py-3"><StatusSelect eventId={eventId} registrationId={row.id} status={row.status} /></td>
                    <td className="py-3">{checked ? formatWhen(checked.checkedInAt) : "Not checked in"}</td>
                    <td className="py-3 pr-4 text-muted">{formatWhen(row.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {pageCount > 1 ? (
        <div className="mt-4 flex gap-3 text-sm">
          {page > 1 ? <Link href={`?${new URLSearchParams({ ...Object.fromEntries(queryBase), page: String(page - 1) })}`}>Previous</Link> : null}
          <span className="text-muted">Page {page} of {pageCount}</span>
          {page < pageCount ? <Link href={`?${new URLSearchParams({ ...Object.fromEntries(queryBase), page: String(page + 1) })}`}>Next</Link> : null}
        </div>
      ) : null}
    </div>
  );
}
