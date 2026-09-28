import { PlatformRole, Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { PERMISSIONS, allows, type Permission } from "@/lib/access-policy";
import { heldGrants } from "@/lib/authorize";
import { auth, signOut } from "@/lib/auth";
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
  if (user.status === "SUSPENDED") await signOut({ redirectTo: "/login?error=suspended" });
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
  const grants = await heldGrants(user);
  const scope = { type: "EVENT" as const, id: event.id, clubId: event.clubId };
  const permissions = (Object.keys(PERMISSIONS) as Permission[]).filter((permission) => allows(grants, permission, scope));
  if (!permissions.includes("EVENT_VIEW")) return null;
  const level = user.role === "SUPER_ADMIN" || allows(grants, "CLUB_EDIT", { type: "CLUB", id: event.clubId })
    ? "full" as const
    : permissions.includes("EVENT_EDIT")
      ? "manage" as const
      : "scan" as const;
  return { event, level, permissions };
}

export async function requireEventPermission(eventId: string, permission: Permission) {
  const user = await requireUser();
  const access = await getEventAccess(user, eventId);
  if (!access?.permissions.includes(permission)) redirect("/admin/events");
  return { user, ...access };
}

export async function requireEventAccess(eventId: string, allowed: AccessLevel[] = ["full", "manage", "scan"]) {
  const user = await requireUser();
  const access = await getEventAccess(user, eventId);
  if (!access || !allowed.includes(access.level)) redirect("/admin");
  return { user, ...access };
}

export async function canAccessAdmin(user: CurrentUser) {
  if (user.role === "SUPER_ADMIN") return true;
  const [staff, club, grant, unit] = await Promise.all([
    prisma.eventStaff.findFirst({ where: { userId: user.id } }),
    prisma.clubMember.findFirst({ where: { userId: user.id, role: "CLUB_ADMIN" } }),
    prisma.permissionGrant.findFirst({ where: { userId: user.id, revokedAt: null } }),
    prisma.orgMembership.findFirst({ where: { userId: user.id, removedAt: null, unit: { archivedAt: null } } }),
  ]);
  return Boolean(staff || club || grant || unit);
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!(await canAccessAdmin(user))) redirect("/home");
  return user;
}

export function canManageClub(user: { id: string; role: PlatformRole }, club: { id?: string; members: { userId: string; role: string }[] }) {
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
