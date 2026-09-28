"use server";

import { revalidatePath } from "next/cache";
import { writeAudit } from "@/lib/authorize";
import { prisma } from "@/lib/db";
import { canManageClub, requireUser, upgradeRole } from "@/lib/permissions";
import { slugify } from "@/lib/utils";
import { clubSchema, issueMessage } from "@/lib/validators";

export async function createClub(input: unknown) {
  const user = await requireUser();
  if (user.role !== "SUPER_ADMIN") return { ok: false as const, error: "Only a super admin can create clubs." };
  const parsed = clubSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: issueMessage(parsed.error) };
  try {
    const club = await prisma.club.create({
      data: { name: parsed.data.name, slug: parsed.data.slug || slugify(parsed.data.name), description: parsed.data.description || null },
    });
    await writeAudit({ actorId: user.id, action: "CLUB_CREATED", targetType: "Club", targetId: club.id, scopeType: "SYSTEM", metadata: { name: club.name } });
    revalidatePath("/admin/clubs");
    return { ok: true as const, id: club.id };
  } catch {
    return { ok: false as const, error: "A club with that slug already exists." };
  }
}

export async function updateClub(clubId: string, input: unknown, logo?: string | null) {
  const user = await requireUser();
  const club = await prisma.club.findUnique({ where: { id: clubId }, include: { members: true } });
  if (!club || !canManageClub(user, club)) return { ok: false as const, error: "You cannot edit this club." };
  const parsed = clubSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: issueMessage(parsed.error) };
  try {
    await prisma.club.update({
      where: { id: clubId },
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description || null,
        ...(logo !== undefined ? { logo } : {}),
      },
    });
  } catch {
    return { ok: false as const, error: "A club with that slug already exists." };
  }
  revalidatePath(`/admin/clubs/${clubId}`);
  return { ok: true as const };
}

export async function addClubMember(clubId: string, email: string, role: "CLUB_ADMIN" | "MEMBER") {
  const user = await requireUser();
  const club = await prisma.club.findUnique({ where: { id: clubId }, include: { members: true } });
  if (!club || !canManageClub(user, club)) return { ok: false as const, error: "You cannot manage this club." };
  const member = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!member) return { ok: false as const, error: "No account found for that email. Ask them to sign up first." };
  if (member.id === user.id) return { ok: false as const, error: "You cannot change your own permissions." };
  const existing = club.members.find((row) => row.userId === member.id);
  if ((role === "CLUB_ADMIN" || existing?.role === "CLUB_ADMIN") && user.role !== "SUPER_ADMIN") {
    return { ok: false as const, error: "Only a super admin can assign a club admin." };
  }
  await prisma.clubMember.upsert({
    where: { clubId_userId: { clubId, userId: member.id } },
    update: { role },
    create: { clubId, userId: member.id, role },
  });
  if (role === "CLUB_ADMIN") {
    await prisma.user.update({ where: { id: member.id }, data: { role: upgradeRole(member.role, "CLUB_ADMIN") } });
  }
  await writeAudit({ actorId: user.id, action: role === "CLUB_ADMIN" ? "CLUB_ADMIN_ASSIGNED" : "CLUB_MEMBER_ADDED", targetType: "User", targetId: member.id, scopeType: "CLUB", scopeId: clubId });
  revalidatePath(`/admin/clubs/${clubId}`);
  return { ok: true as const };
}

export async function removeClubMember(clubId: string, userId: string) {
  const user = await requireUser();
  const club = await prisma.club.findUnique({ where: { id: clubId }, include: { members: true } });
  if (!club || !canManageClub(user, club)) return { ok: false as const, error: "You cannot manage this club." };
  if (userId === user.id) return { ok: false as const, error: "You cannot change your own permissions." };
  const existing = club.members.find((row) => row.userId === userId);
  if (existing?.role === "CLUB_ADMIN" && user.role !== "SUPER_ADMIN") {
    return { ok: false as const, error: "Only a super admin can remove a club admin." };
  }
  await prisma.clubMember.deleteMany({ where: { clubId, userId } });
  await writeAudit({ actorId: user.id, action: "CLUB_MEMBER_REMOVED", targetType: "User", targetId: userId, scopeType: "CLUB", scopeId: clubId });
  revalidatePath(`/admin/clubs/${clubId}`);
  return { ok: true as const };
}

export async function archiveClub(clubId: string) {
  const user = await requireUser();
  if (user.role !== "SUPER_ADMIN") return { ok: false as const, error: "Only a super admin can archive a club." };
  await prisma.club.update({ where: { id: clubId }, data: { archivedAt: new Date() } });
  await writeAudit({ actorId: user.id, action: "CLUB_ARCHIVED", targetType: "Club", targetId: clubId, scopeType: "SYSTEM" });
  revalidatePath("/admin/clubs");
  return { ok: true as const };
}
