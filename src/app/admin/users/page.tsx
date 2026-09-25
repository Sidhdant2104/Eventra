import { redirect } from "next/navigation";
import { RoleSelect } from "@/components/role-select";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/permissions";

export const metadata = { title: "Users" };

export default async function UsersPage() {
  const actor = await requireUser();
  if (actor.role !== "SUPER_ADMIN") redirect("/admin");
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, include: { profile: true } });
  return (
    <div>
      <h1 className="font-display text-5xl">Users</h1>
      <div className="mt-6 overflow-x-auto rounded-3xl border border-line bg-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-muted"><tr><th className="px-3 py-3">Name</th><th>Email</th><th>Department</th><th>Role</th></tr></thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-line">
                <td className="px-3 py-3">{user.name}</td>
                <td>{user.email}</td>
                <td>{user.profile?.department ?? "—"}</td>
                <td><RoleSelect userId={user.id} role={user.role} disabled={user.id === actor.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
