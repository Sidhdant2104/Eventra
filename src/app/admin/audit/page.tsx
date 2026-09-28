import { prisma } from "@/lib/db";
import { formatWhen } from "@/lib/format";
import { requireUser } from "@/lib/permissions";
import { notFound } from "next/navigation";

export const metadata = { title: "Audit log" };

const labels: Record<string, string> = {
  CLUB_CREATED: "Club created",
  CLUB_ARCHIVED: "Club archived",
  CLUB_ADMIN_ASSIGNED: "Club admin assigned",
  CLUB_MEMBER_ADDED: "Club member added",
  CLUB_MEMBER_REMOVED: "Club member removed",
  TEAM_CREATED: "Team created",
  TEAM_ARCHIVED: "Team archived",
  PERMISSION_GRANTED: "Permission granted",
  PERMISSION_REVOKED: "Permission revoked",
  EVENT_CREATED: "Event created",
  EVENT_PUBLISHED: "Event published",
  EVENT_ARCHIVED: "Event archived",
  EVENT_UNPUBLISHED: "Event moved to draft",
  EVENT_PAGE_MODIFIED: "Event page edited",
  REGISTRATION_MODIFIED: "Registration changed",
  ATTENDANCE_MARKED: "Attendance marked",
  CERTIFICATE_ISSUED: "Certificates issued",
  CERTIFICATE_REVOKED: "Certificate revoked",
  CERTIFICATE_RESTORED: "Certificate restored",
};

export default async function AuditPage() {
  const user = await requireUser();
  if (user.role !== "SUPER_ADMIN") notFound();
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { actor: { select: { name: true, email: true } } },
  });
  return (
    <div>
      <h1 className="font-display text-5xl">Audit log</h1>
      <p className="mt-2 text-sm text-secondary">Administrative changes, newest first.</p>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-[11px] uppercase tracking-[0.14em] text-muted">
            <tr><th className="py-3 font-medium">When</th><th className="font-medium">Who</th><th className="font-medium">Action</th><th className="font-medium">Scope</th></tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-line">
                <td className="py-3 whitespace-nowrap">{formatWhen(log.createdAt)}</td>
                <td>{log.actor.name}</td>
                <td>{labels[log.action] ?? log.action}</td>
                <td className="text-muted">{[log.scopeType, log.scopeId].filter(Boolean).join(" · ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 ? <p className="border-t border-line py-8 text-sm text-muted">No administrative actions recorded yet.</p> : null}
      </div>
    </div>
  );
}
