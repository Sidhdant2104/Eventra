import { Card, Input, Select } from "@/components/ui";
import { prisma } from "@/lib/db";
import { formatWhen } from "@/lib/format";
import { requireEventAccess } from "@/lib/permissions";

export default async function AttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const { eventId } = await params;
  await requireEventAccess(eventId);
  const query = await searchParams;
  const q = query.q?.trim().toLowerCase() ?? "";
  const participants = await prisma.registrationParticipant.findMany({
    where: { eventId, registration: { status: { in: ["CONFIRMED", "ATTENDED"] } } },
    include: { user: true, registration: { include: { team: true } } },
    orderBy: { user: { name: "asc" } },
  });
  const attendance = await prisma.attendance.findMany({ where: { eventId } });
  const byUser = new Map(attendance.map((row) => [row.userId, row]));
  const rows = participants.filter((participant) => {
    const checked = byUser.has(participant.userId);
    if (query.filter === "in" && !checked) return false;
    if (query.filter === "out" && checked) return false;
    if (!q) return true;
    return participant.user.name.toLowerCase().includes(q) || participant.registration.code.toLowerCase().includes(q);
  });
  const total = participants.length;
  const checked = participants.filter((participant) => byUser.has(participant.userId)).length;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <Card className="p-4"><p className="text-sm text-muted">Registered</p><p className="font-display text-3xl">{total}</p></Card>
        <Card className="p-4"><p className="text-sm text-muted">Checked in</p><p className="font-display text-3xl">{checked}</p></Card>
        <Card className="p-4"><p className="text-sm text-muted">Not checked in</p><p className="font-display text-3xl">{total - checked}</p></Card>
        <Card className="p-4"><p className="text-sm text-muted">Attendance</p><p className="font-display text-3xl">{total ? Math.round((checked / total) * 100) : 0}%</p></Card>
      </div>
      <form className="flex flex-wrap gap-2">
        <Input name="q" defaultValue={query.q ?? ""} placeholder="Search participants" aria-label="Search participants" />
        <Select name="filter" defaultValue={query.filter ?? "all"} aria-label="Attendance filter">
          <option value="all">All</option>
          <option value="in">Checked in</option>
          <option value="out">Not checked in</option>
        </Select>
        <button className="rounded-full bg-ink px-4 text-sm font-semibold text-white" type="submit">Apply</button>
      </form>
      <div className="overflow-x-auto rounded-3xl border border-line bg-card">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-muted"><tr><th className="px-3 py-3">Name</th><th>Registration</th><th>Team</th><th>Status</th><th>Check-in</th></tr></thead>
          <tbody>
            {rows.map((row) => {
              const record = byUser.get(row.userId);
              return (
                <tr key={row.id} className="border-t border-line">
                  <td className="px-3 py-3">{row.user.name}</td>
                  <td>{row.registration.code}</td>
                  <td>{row.registration.team?.name ?? "—"}</td>
                  <td>{record ? "Checked in" : "Not checked in"}</td>
                  <td>{record ? formatWhen(record.checkedInAt) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
