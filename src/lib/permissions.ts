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

export async function scopedEvents(user: { id: string; role: PlatformRole }) {
  const grants = await heldGrants(user);
  const events = await prisma.event.findMany({ select: { id: true, clubId: true } });
  const target = (event: { id: string; clubId: string }) => ({ type: "EVENT" as const, id: event.id, clubId: event.clubId });
  const ids = (permission: Permission) => events.filter((event) => allows(grants, permission, target(event))).map((event) => event.id);
  return {
    grants,
    viewIds: ids("EVENT_VIEW"),
    registrationIds: [...new Set([...ids("REGISTRATIONS_VIEW"), ...ids("ANALYTICS_VIEW")])],
    attendanceIds: [...new Set([...ids("ATTENDANCE_VIEW"), ...ids("ANALYTICS_VIEW")])],
    certificateIds: [...new Set([...ids("CERTIFICATE_ISSUE"), ...ids("ANALYTICS_VIEW")])],
    announcementIds: [...new Set([...ids("ANNOUNCEMENT_SEND"), ...ids("EVENT_EDIT")])],
  };
}

export async function canViewAnyClub(user: { id: string; role: PlatformRole }) {
  if (user.role === "SUPER_ADMIN") return true;
  const grants = await heldGrants(user);
  const clubs = await prisma.club.findMany({ where: { archivedAt: null }, select: { id: true } });
  return clubs.some((club) => allows(grants, "CLUB_VIEW", { type: "CLUB", id: club.id }));
}

export async function canCreateEvent(user: { id: string; role: PlatformRole }) {
  const grants = await heldGrants(user);
  const clubs = await prisma.club.findMany({ where: { archivedAt: null }, select: { id: true } });
  return clubs.some((club) => allows(grants, "EVENT_CREATE", { type: "CLUB", id: club.id }));
}

export async function adminPortalNav(user: { id: string; role: PlatformRole }) {
  const grants = await heldGrants(user);
  const [clubs, events] = await Promise.all([
    prisma.club.findMany({ where: { archivedAt: null }, select: { id: true, name: true } }),
    prisma.event.findMany({ select: { id: true, name: true, clubId: true } }),
  ]);
  const visibleClubs = clubs.filter((club) => allows(grants, "CLUB_VIEW", { type: "CLUB", id: club.id }));
  const visibleEvents = events.filter((event) => allows(grants, "EVENT_VIEW", { type: "EVENT", id: event.id, clubId: event.clubId }));
  const focused = visibleClubs.length === 0 && visibleEvents.length === 1 ? visibleEvents[0] : null;
  if (focused) {
    const scope = { type: "EVENT" as const, id: focused.id, clubId: focused.clubId };
    const base = `/admin/events/${focused.id}`;
    const item = (permission: Permission, href: string, label: string) => (allows(grants, permission, scope) ? [{ href, label }] : []);
    return {
      context: focused.name,
      groups: [
        { label: "Overview", links: [{ href: "/admin", label: "Dashboard", exact: true }, { href: base, label: "Overview", exact: true }] },
        {
          label: focused.name,
          links: [
            ...item("EVENT_PAGE_EDIT", `${base}/builder`, "Event page"),
            ...item("REGISTRATIONS_VIEW", `${base}/registrations`, "Registrations"),
            ...item("TEAM_VIEW", `${base}/teams`, "Teams"),
            ...item("ATTENDANCE_SCAN", `${base}/scanner`, "Scan QR"),
            ...item("ATTENDANCE_VIEW", `${base}/attendance`, "Attendance"),
            ...item("ANNOUNCEMENT_SEND", `${base}/announcements`, "Announcements"),
            ...item("CERTIFICATE_ISSUE", `${base}/certificates`, "Certificates"),
            ...item("EVENT_MANAGE_SETTINGS", `${base}/settings`, "Settings"),
          ],
        },
      ].filter((group) => group.links.length > 0),
    };
  }
  const canCreate = clubs.some((club) => allows(grants, "EVENT_CREATE", { type: "CLUB", id: club.id }));
  const system = grants.some((grant) => grant.scopeType === "SYSTEM");
  const club = visibleClubs.length === 1 ? visibleClubs[0] : null;
  const canDelegate = club ? allows(grants, "DELEGATE", { type: "CLUB", id: club.id }) : false;
  const groups = [
    { label: "Overview", links: [{ href: "/admin", label: "Dashboard", exact: true }] },
    {
      label: "Organization",
      links: [
        ...(visibleClubs.length ? [{ href: "/admin/clubs", label: "Clubs" }] : []),
        ...(system ? [{ href: "/admin/users", label: "People" }] : club ? [{ href: `/admin/clubs/${club.id}`, label: "People" }] : []),
        ...(canDelegate && club ? [{ href: `/admin/clubs/${club.id}/access`, label: "Access" }] : []),
      ],
    },
    {
      label: "Events",
      links: [
        ...(visibleEvents.length ? [{ href: "/admin/events", label: "Events" }] : []),
        ...(canCreate ? [{ href: "/admin/events/new", label: "Create event" }] : []),
      ],
    },
    {
      label: "System",
      links: system ? [{ href: "/admin/academics", label: "Academics" }, { href: "/admin/audit", label: "Audit log" }] : [],
    },
  ].filter((group) => group.links.length > 0);
  return {
    context: club?.name ?? (system ? "Campus" : "My events"),
    groups,
  };
}
