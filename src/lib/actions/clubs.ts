"use server";

import { revalidatePath } from "next/cache";
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
  await prisma.clubMember.upsert({
    where: { clubId_userId: { clubId, userId: member.id } },
    update: { role },
    create: { clubId, userId: member.id, role },
  });
  if (role === "CLUB_ADMIN") {
    await prisma.user.update({ where: { id: member.id }, data: { role: upgradeRole(member.role, "CLUB_ADMIN") } });
  }
  revalidatePath(`/admin/clubs/${clubId}`);
  return { ok: true as const };
}

export async function removeClubMember(clubId: string, userId: string) {
  const user = await requireUser();
  const club = await prisma.club.findUnique({ where: { id: clubId }, include: { members: true } });
  if (!club || !canManageClub(user, club)) return { ok: false as const, error: "You cannot manage this club." };
  await prisma.clubMember.deleteMany({ where: { clubId, userId } });
  revalidatePath(`/admin/clubs/${clubId}`);
  return { ok: true as const };
}
