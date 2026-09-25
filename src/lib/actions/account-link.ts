"use server";

import { revalidatePath } from "next/cache";
import { hashToken } from "@/lib/crypto";
import { prisma } from "@/lib/db";
import { canRemoveLoginMethod } from "@/lib/auth-policy";
import { requireUser } from "@/lib/permissions";

export async function consumePendingLink(token: string) {
  const user = await requireUser();
  const row = await prisma.pendingAuthLink.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!row || row.consumedAt || row.expiresAt.getTime() < Date.now()) {
    return { ok: false as const, error: "This connection request has expired. Start the provider sign-in again." };
  }
  if (!user.email || !user.emailVerified || user.email.toLowerCase() !== row.providerEmail) {
    return { ok: false as const, error: "Sign in to the NMIET One account for this email before connecting the provider." };
  }
  const taken = await prisma.account.findUnique({
    where: { provider_providerAccountId: { provider: row.provider, providerAccountId: row.providerAccountId } },
  });
  if (taken && taken.userId !== user.id) {
    return { ok: false as const, error: "This login is already connected to another account." };
  }
  if (!taken) {
    await prisma.account.create({
      data: {
        userId: user.id,
        type: row.provider === "google" ? "oidc" : "oauth",
        provider: row.provider,
        providerAccountId: row.providerAccountId,
      },
    });
  }
  await prisma.authIdentity.upsert({
    where: { provider_providerAccountId: { provider: row.provider, providerAccountId: row.providerAccountId } },
    update: { userId: user.id, providerEmail: row.providerEmail },
    create: {
      userId: user.id,
      provider: row.provider,
      providerAccountId: row.providerAccountId,
      providerEmail: row.providerEmail,
    },
  });
  await prisma.pendingAuthLink.update({ where: { id: row.id }, data: { consumedAt: new Date() } });
  revalidatePath("/settings");
  return { ok: true as const };
}

export async function disconnectLoginMethod(provider: string) {
  const user = await requireUser();
  if (!["google", "github", "phone"].includes(provider)) return { ok: false as const, error: "That login method cannot be removed here." };
  const methods = await prisma.authIdentity.count({ where: { userId: user.id } });
  if (!canRemoveLoginMethod({ methods, hasPassword: Boolean(user.passwordHash) })) {
    return { ok: false as const, error: "Keep at least one way to sign in." };
  }
  await prisma.$transaction([
    prisma.authIdentity.deleteMany({ where: { userId: user.id, provider } }),
    prisma.account.deleteMany({ where: { userId: user.id, provider } }),
    ...(provider === "phone" ? [prisma.studentProfile.updateMany({ where: { userId: user.id }, data: { phone: null } })] : []),
  ]);
  revalidatePath("/settings");
  return { ok: true as const };
}
