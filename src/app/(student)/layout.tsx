import { StudentShell } from "@/components/shells";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/permissions";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const unread = user ? await prisma.notification.count({ where: { userId: user.id, readAt: null } }) : 0;
  return <StudentShell name={user?.name} image={user?.image} unread={unread}>{children}</StudentShell>;
}
