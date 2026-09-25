import { AdminShell } from "@/components/shells";
import { canAccessAdmin, requireUser } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (!(await canAccessAdmin(user))) redirect("/home");
  return (
    <AdminShell name={user.name} role={user.role} showUsers={user.role === "SUPER_ADMIN"}>
      {children}
    </AdminShell>
  );
}
