"use server";

import { revalidatePath } from "next/cache";
import { canDelegate, isPermission, TEAM_PRESETS, type Permission } from "@/lib/access-policy";
import { heldGrants, writeAudit } from "@/lib/authorize";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/permissions";

function presetPermissions(preset: string): Permission[] {
  return TEAM_PRESETS.find((item) => item.id === preset)?.permissions ?? ["EVENT_VIEW"];
}

async function findStudent(email: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) return { ok: false as const, error: "No account found for that email. Ask them to sign up first." };
  if (user.status !== "ACTIVE") return { ok: false as const, error: "That account is suspended." };
  return { ok: true as const, user };
}

export async function createOrgUnit(input: { clubId?: string; eventId?: string; parentId?: string; name: string; preset: string }) {
  const actor = await requireUser();
  const name = input.name.trim();
  if (name.length < 2) return { ok: false as const, error: "Give the team a name." };
  const permissions = presetPermissions(input.preset);
  const grants = await heldGrants(actor);
  if (input.eventId) {
    const event = await prisma.event.findUnique({ where: { id: input.eventId }, select: { id: true, clubId: true } });
    if (!event) return { ok: false as const, error: "Event not found." };
    const decision = canDelegate({ grants, actorId: actor.id, subjectId: "new-team", permission: "EVENT_VIEW", target: { type: "EVENT", id: event.id, clubId: event.clubId } });
    if (!decision.ok) return decision;
    if (input.parentId) {
      const parent = await prisma.orgUnit.findFirst({ where: { id: input.parentId, eventId: event.id, archivedAt: null } });
      if (!parent) return { ok: false as const, error: "That parent team is not part of this event." };
    }
    const unit = await prisma.orgUnit.create({ data: { eventId: event.id, parentId: input.parentId || null, name, permissions } });
    await writeAudit({ actorId: actor.id, action: "TEAM_CREATED", targetType: "OrgUnit", targetId: unit.id, scopeType: "EVENT", scopeId: event.id, metadata: { name } });
    revalidatePath(`/admin/events/${event.id}/access`);
    return { ok: true as const };
  }
  if (!input.clubId) return { ok: false as const, error: "Choose a club or an event." };
  const decision = canDelegate({ grants, actorId: actor.id, subjectId: "new-team", permission: "CLUB_MANAGE_TEAMS", target: { type: "CLUB", id: input.clubId } });
  if (!decision.ok) return { ok: false as const, error: "You cannot create teams for this club." };
  if (input.parentId) {
    const parent = await prisma.orgUnit.findFirst({ where: { id: input.parentId, clubId: input.clubId, archivedAt: null } });
    if (!parent) return { ok: false as const, error: "That parent team is not part of this club." };
  }
  const unit = await prisma.orgUnit.create({ data: { clubId: input.clubId, parentId: input.parentId || null, name, permissions } });
  await writeAudit({ actorId: actor.id, action: "TEAM_CREATED", targetType: "OrgUnit", targetId: unit.id, scopeType: "CLUB", scopeId: input.clubId, metadata: { name } });
  revalidatePath(`/admin/clubs/${input.clubId}/access`);
  return { ok: true as const };
}

export async function archiveOrgUnit(unitId: string) {
  const actor = await requireUser();
  const unit = await prisma.orgUnit.findUnique({ where: { id: unitId } });
  if (!unit) return { ok: false as const, error: "Team not found." };
  const grants = await heldGrants(actor);
  const target = unit.eventId
    ? { type: "EVENT" as const, id: unit.eventId, clubId: unit.clubId ?? "" }
    : { type: "CLUB" as const, id: unit.clubId ?? "" };
  if (!unit.eventId && !unit.clubId) return { ok: false as const, error: "Team not found." };
  if (unit.eventId) {
    const event = await prisma.event.findUnique({ where: { id: unit.eventId }, select: { clubId: true } });
    if (!event || !canDelegate({ grants, actorId: actor.id, subjectId: "archive", permission: "EVENT_VIEW", target: { type: "EVENT", id: unit.eventId, clubId: event.clubId } }).ok) {
      return { ok: false as const, error: "You cannot archive this team." };
    }
  } else if (!canDelegate({ grants, actorId: actor.id, subjectId: "archive", permission: "CLUB_MANAGE_TEAMS", target }).ok) {
    return { ok: false as const, error: "You cannot archive this team." };
  }
  await prisma.$transaction([
    prisma.orgUnit.update({ where: { id: unitId }, data: { archivedAt: new Date() } }),
    prisma.permissionGrant.updateMany({ where: { orgUnitId: unitId, revokedAt: null }, data: { revokedAt: new Date(), revokedById: actor.id } }),
    prisma.orgMembership.updateMany({ where: { unitId, removedAt: null }, data: { removedAt: new Date() } }),
  ]);
  await writeAudit({ actorId: actor.id, action: "TEAM_ARCHIVED", targetType: "OrgUnit", targetId: unitId, scopeType: unit.eventId ? "EVENT" : "CLUB", scopeId: unit.eventId ?? unit.clubId });
  if (unit.clubId) revalidatePath(`/admin/clubs/${unit.clubId}/access`);
  if (unit.eventId) revalidatePath(`/admin/events/${unit.eventId}/access`);
  return { ok: true as const };
}

export async function addOrgMember(unitId: string, email: string, lead: boolean) {
  const actor = await requireUser();
  const unit = await prisma.orgUnit.findUnique({ where: { id: unitId } });
  if (!unit || unit.archivedAt) return { ok: false as const, error: "Team not found." };
  const student = await findStudent(email);
  if (!student.ok) return student;
  if (student.user.id === actor.id) return { ok: false as const, error: "You cannot change your own permissions." };
  const grants = await heldGrants(actor);
  let scopeType: "CLUB" | "EVENT" = "CLUB";
  let scopeId = unit.clubId ?? "";
  let target: { type: "CLUB"; id: string } | { type: "EVENT"; id: string; clubId: string };
  if (unit.eventId) {
    const event = await prisma.event.findUnique({ where: { id: unit.eventId }, select: { clubId: true } });
    if (!event) return { ok: false as const, error: "Event not found." };
    scopeType = "EVENT";
    scopeId = unit.eventId;
    target = { type: "EVENT", id: unit.eventId, clubId: event.clubId };
  } else if (unit.clubId) {
    target = { type: "CLUB", id: unit.clubId };
  } else {
    return { ok: false as const, error: "Team not found." };
  }
  const permissions = unit.permissions.filter(isPermission);
  for (const permission of permissions) {
    const decision = canDelegate({ grants, actorId: actor.id, subjectId: student.user.id, permission, target });
    if (!decision.ok) return decision;
  }
  await prisma.orgMembership.upsert({
    where: { unitId_userId: { unitId, userId: student.user.id } },
    update: { lead, removedAt: null, assignedById: actor.id },
    create: { unitId, userId: student.user.id, lead, assignedById: actor.id },
  });
  for (const permission of permissions) {
    const existing = await prisma.permissionGrant.findFirst({ where: { userId: student.user.id, permission, scopeType, scopeId, orgUnitId: unitId, revokedAt: null } });
    if (!existing) {
      await prisma.permissionGrant.create({ data: { userId: student.user.id, permission, scopeType, scopeId, orgUnitId: unitId, grantedById: actor.id } });
    }
  }
  await writeAudit({
    actorId: actor.id,
    action: "PERMISSION_GRANTED",
    targetType: "User",
    targetId: student.user.id,
    scopeType,
    scopeId,
    metadata: { team: unit.name, lead },
  });
  if (unit.clubId) revalidatePath(`/admin/clubs/${unit.clubId}/access`);
  if (unit.eventId) revalidatePath(`/admin/events/${unit.eventId}/access`);
  return { ok: true as const };
}

export async function removeOrgMember(unitId: string, userId: string) {
  const actor = await requireUser();
  if (userId === actor.id) return { ok: false as const, error: "You cannot change your own permissions." };
  const unit = await prisma.orgUnit.findUnique({ where: { id: unitId } });
  if (!unit) return { ok: false as const, error: "Team not found." };
  const grants = await heldGrants(actor);
  const allowed = unit.eventId
    ? await (async () => {
        const event = await prisma.event.findUnique({ where: { id: unit.eventId! }, select: { clubId: true } });
        return Boolean(event && canDelegate({ grants, actorId: actor.id, subjectId: userId, permission: "EVENT_VIEW", target: { type: "EVENT", id: unit.eventId!, clubId: event.clubId } }).ok);
      })()
    : canDelegate({ grants, actorId: actor.id, subjectId: userId, permission: "CLUB_MANAGE_MEMBERS", target: { type: "CLUB", id: unit.clubId ?? "" } }).ok;
  if (!allowed) return { ok: false as const, error: "You cannot remove this person." };
  await prisma.$transaction([
    prisma.orgMembership.updateMany({ where: { unitId, userId, removedAt: null }, data: { removedAt: new Date() } }),
    prisma.permissionGrant.updateMany({ where: { orgUnitId: unitId, userId, revokedAt: null }, data: { revokedAt: new Date(), revokedById: actor.id } }),
  ]);
  await writeAudit({ actorId: actor.id, action: "PERMISSION_REVOKED", targetType: "User", targetId: userId, scopeType: unit.eventId ? "EVENT" : "CLUB", scopeId: unit.eventId ?? unit.clubId, metadata: { team: unit.name } });
  if (unit.clubId) revalidatePath(`/admin/clubs/${unit.clubId}/access`);
  if (unit.eventId) revalidatePath(`/admin/events/${unit.eventId}/access`);
  return { ok: true as const };
}
