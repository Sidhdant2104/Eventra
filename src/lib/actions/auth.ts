"use server";

import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { hashToken, randomToken } from "@/lib/crypto";
import { appUrl } from "@/lib/utils";
import { issueMessage, registerSchema } from "@/lib/validators";

export async function registerAccount(input: unknown) {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: issueMessage(parsed.error) };
  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { ok: false as const, error: "An account with this email already exists." };
  const created = await prisma.user.create({
    data: {
      email,
      name: parsed.data.name,
      passwordHash: await hash(parsed.data.password, 12),
      role: "STUDENT",
      profile: { create: { college: "NMIET" } },
      identities: { create: { provider: "email", providerAccountId: email, providerEmail: email } },
    },
  });
  await sendVerification(created.id, email);
  return { ok: true as const };
}

async function sendVerification(userId: string, email: string) {
  const token = randomToken();
  await prisma.emailVerificationToken.create({
    data: { userId, email, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
  });
  const link = `${appUrl()}/verify-email?token=${token}`;
  await sendEmail({
    to: email,
    subject: "Verify your NMIET One email",
    text: `Confirm this email for your NMIET One account:\n${link}\n\nThe link expires in one hour.`,
  });
  return process.env.NODE_ENV !== "production" && (process.env.EMAIL_PROVIDER ?? "console") === "console" ? link : null;
}

export async function requestEmailVerification(emailInput: string) {
  const { requireUser } = await import("@/lib/permissions");
  const user = await requireUser();
  const email = emailInput.toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false as const, error: "Enter a valid email." };
  const taken = await prisma.user.findUnique({ where: { email } });
  if (taken && taken.id !== user.id) return { ok: false as const, error: "An account with this email already exists." };
  const devLink = await sendVerification(user.id, email);
  return { ok: true as const, devLink };
}

export async function confirmEmail(token: string) {
  const row = await prisma.emailVerificationToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) {
    return { ok: false as const, error: "This verification link is invalid or has expired." };
  }
  const taken = await prisma.user.findUnique({ where: { email: row.email } });
  if (taken && taken.id !== row.userId) return { ok: false as const, error: "An account with this email already exists." };
  try {
    await prisma.$transaction(async (tx) => {
      const used = await tx.emailVerificationToken.updateMany({
        where: { id: row.id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      });
      if (used.count !== 1) throw new Error("expired");
      await tx.user.update({ where: { id: row.userId }, data: { email: row.email, emailVerified: new Date() } });
      await tx.authIdentity.deleteMany({ where: { userId: row.userId, provider: "email" } });
      await tx.authIdentity.create({ data: { userId: row.userId, provider: "email", providerAccountId: row.email, providerEmail: row.email } });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "expired") {
      return { ok: false as const, error: "This verification link is invalid or has expired." };
    }
    throw error;
  }
  return { ok: true as const };
}

export async function requestPasswordReset(emailInput: string) {
  const email = emailInput.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash) return { ok: true as const, devLink: null as string | null };
  const token = randomToken();
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });
  const link = `${appUrl()}/reset-password?token=${token}`;
  await sendEmail({
    to: email,
    subject: "Reset your NMIET One password",
    text: `Reset your password within the next hour:\n${link}\n\nIf you did not ask for this, you can ignore the email.`,
  });
  const devLink = process.env.NODE_ENV !== "production" && (process.env.EMAIL_PROVIDER ?? "console") === "console" ? link : null;
  return { ok: true as const, devLink };
}

export async function resetPassword(token: string, password: string) {
  if (password.length < 8) return { ok: false as const, error: "Use at least 8 characters." };
  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) {
    return { ok: false as const, error: "This reset link is invalid or has expired." };
  }
  await prisma.$transaction([
    prisma.user.update({ where: { id: row.userId }, data: { passwordHash: await hash(password, 12) } }),
    prisma.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
  ]);
  return { ok: true as const };
}
