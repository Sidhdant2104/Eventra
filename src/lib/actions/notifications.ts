"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/permissions";

export async function markNotificationRead(id: string) {
  const user = await requireUser();
  await prisma.notification.updateMany({ where: { id, userId: user.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/notifications");
  revalidatePath("/home");
}

export async function markAllNotificationsRead(formData?: FormData) {
  void formData;
  const user = await requireUser();
  await prisma.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/notifications");
  revalidatePath("/home");
}
