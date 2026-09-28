import { StudentShell } from "@/components/shells";
import { prisma } from "@/lib/db";
import { canAccessAdmin, getCurrentUser } from "@/lib/permissions";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const unread = user ? await prisma.notification.count({ where: { userId: user.id, readAt: null } }) : 0;
  const workspace = user ? await canAccessAdmin(user) : false;
  return <StudentShell name={user?.name} image={user?.image} unread={unread} workspace={workspace}>{children}</StudentShell>;
}
