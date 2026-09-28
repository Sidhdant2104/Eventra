import { AdminShell } from "@/components/shells";
import { adminPortalNav, canAccessAdmin, requireUser } from "@/lib/permissions";
import { redirect } from "next/navigation";

export const metadata = { title: { default: "Eventra Admin", template: "%s · Eventra Admin" } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (!(await canAccessAdmin(user))) redirect("/home");
  const portal = await adminPortalNav(user);
  return (
    <AdminShell name={user.name} context={portal.context} groups={portal.groups}>
      {children}
    </AdminShell>
  );
}
