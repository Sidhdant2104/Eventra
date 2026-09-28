import type { PlatformRole } from "@prisma/client";
import {
  allows,
  CLUB_ADMIN_PERMISSIONS,
  EVENT_MANAGER_PERMISSIONS,
  SCANNER_PERMISSIONS,
  type AccessScope,
  type HeldGrant,
  type Permission,
  isPermission,
} from "@/lib/access-policy";
import { prisma } from "@/lib/db";

type Actor = { id: string; role: PlatformRole };

export async function heldGrants(user: Actor): Promise<HeldGrant[]> {
  if (user.role === "SUPER_ADMIN") {
    return CLUB_ADMIN_PERMISSIONS.map((permission) => ({ permission, scopeType: "SYSTEM" as const, scopeId: "" }));
  }
  const [clubs, staff, grants] = await Promise.all([
    prisma.clubMember.findMany({ where: { userId: user.id, role: "CLUB_ADMIN", club: { archivedAt: null } }, select: { clubId: true } }),
    prisma.eventStaff.findMany({ where: { userId: user.id }, select: { eventId: true, role: true } }),
    prisma.permissionGrant.findMany({ where: { userId: user.id, revokedAt: null }, select: { permission: true, scopeType: true, scopeId: true } }),
  ]);
  const held: HeldGrant[] = [];
  for (const club of clubs) {
    for (const permission of CLUB_ADMIN_PERMISSIONS) held.push({ permission, scopeType: "CLUB", scopeId: club.clubId });
  }
  for (const row of staff) {
    const bundle = row.role === "EVENT_MANAGER" ? EVENT_MANAGER_PERMISSIONS : SCANNER_PERMISSIONS;
    for (const permission of bundle) held.push({ permission, scopeType: "EVENT", scopeId: row.eventId });
  }
  for (const grant of grants) {
    if (isPermission(grant.permission)) held.push({ permission: grant.permission, scopeType: grant.scopeType, scopeId: grant.scopeId });
  }
  return held;
}

export async function hasPermission(user: Actor, permission: Permission, target: AccessScope) {
  return allows(await heldGrants(user), permission, target);
}

export async function eventScope(eventId: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true, clubId: true, slug: true, name: true } });
  if (!event) return null;
  return { event, scope: { type: "EVENT" as const, id: event.id, clubId: event.clubId } };
}

export async function writeAudit(input: {
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  scopeType?: "SYSTEM" | "CLUB" | "EVENT" | "TEAM" | null;
  scopeId?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      scopeType: input.scopeType ?? null,
      scopeId: input.scopeId ?? null,
      metadata: input.metadata ?? undefined,
    },
  });
}
