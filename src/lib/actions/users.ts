"use server";

import { PlatformRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/permissions";

const ROLES: PlatformRole[] = ["SUPER_ADMIN", "CLUB_ADMIN", "EVENT_MANAGER", "VOLUNTEER", "STUDENT"];

export async function updateUserRole(userId: string, role: PlatformRole) {
  const actor = await requireUser();
  if (actor.role !== "SUPER_ADMIN") return { ok: false as const, error: "Only a super admin can change roles." };
  if (actor.id === userId) return { ok: false as const, error: "You cannot change your own role." };
  if (!ROLES.includes(role)) return { ok: false as const, error: "Unknown role." };
  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/users");
  return { ok: true as const };
}
