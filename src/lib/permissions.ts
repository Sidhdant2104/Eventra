import { PlatformRole, Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const userInclude = { profile: true } satisfies Prisma.UserInclude;

export type CurrentUser = Prisma.UserGetPayload<{ include: typeof userInclude }>;

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id }, include: userInclude });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export type AccessLevel = "full" | "manage" | "scan";

export async function getEventAccess(user: { id: string; role: PlatformRole }, eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      club: { include: { members: true } },
      staff: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
    },
  });
  if (!event) return null;
  if (user.role === "SUPER_ADMIN") return { event, level: "full" as const };
  const clubAdmin = event.club.members.some((member) => member.userId === user.id && member.role === "CLUB_ADMIN");
  if (clubAdmin) return { event, level: "full" as const };
  const staff = event.staff.find((member) => member.userId === user.id);
  if (staff?.role === "EVENT_MANAGER") return { event, level: "manage" as const };
  if (staff?.role === "VOLUNTEER") return { event, level: "scan" as const };
  return null;
}

export async function requireEventAccess(eventId: string, allowed: AccessLevel[] = ["full", "manage", "scan"]) {
  const user = await requireUser();
  const access = await getEventAccess(user, eventId);
  if (!access || !allowed.includes(access.level)) redirect("/admin");
  return { user, ...access };
}

export async function canAccessAdmin(user: CurrentUser) {
  if (user.role !== "STUDENT") return true;
  const [staff, club] = await Promise.all([
    prisma.eventStaff.findFirst({ where: { userId: user.id } }),
    prisma.clubMember.findFirst({ where: { userId: user.id, role: "CLUB_ADMIN" } }),
  ]);
  return Boolean(staff || club);
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!(await canAccessAdmin(user))) redirect("/home");
  return user;
}

export function canManageClub(user: { id: string; role: PlatformRole }, club: { members: { userId: string; role: string }[] }) {
  if (user.role === "SUPER_ADMIN") return true;
  return club.members.some((member) => member.userId === user.id && member.role === "CLUB_ADMIN");
}

const ROLE_RANK: Record<PlatformRole, number> = {
  STUDENT: 0,
  VOLUNTEER: 1,
  EVENT_MANAGER: 2,
  CLUB_ADMIN: 3,
  SUPER_ADMIN: 4,
};

export function upgradeRole(current: PlatformRole, next: PlatformRole) {
  return ROLE_RANK[next] > ROLE_RANK[current] ? next : current;
}
