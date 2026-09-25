"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/permissions";
import { slugify } from "@/lib/utils";

async function requireSuperAdmin() {
  const user = await requireUser();
  if (user.role !== "SUPER_ADMIN") return null;
  return user;
}

export async function addDepartment(collegeId: string, name: string) {
  if (!(await requireSuperAdmin())) return { ok: false as const, error: "Only a super admin can change academic lists." };
  const trimmed = name.trim();
  if (trimmed.length < 2) return { ok: false as const, error: "Enter a department name." };
  await prisma.department.create({ data: { collegeId, name: trimmed } }).catch(() => null);
  revalidatePath("/admin/academics");
  revalidatePath("/onboarding");
  return { ok: true as const };
}

export async function addCollege(name: string) {
  if (!(await requireSuperAdmin())) return { ok: false as const, error: "Only a super admin can change academic lists." };
  const trimmed = name.trim();
  if (trimmed.length < 2) return { ok: false as const, error: "Enter a college name." };
  await prisma.college.create({ data: { name: trimmed, slug: slugify(trimmed) } }).catch(() => null);
  revalidatePath("/admin/academics");
  return { ok: true as const };
}
