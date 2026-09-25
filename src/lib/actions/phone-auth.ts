"use server";

import { Prisma } from "@prisma/client";
import { randomInt } from "crypto";
import { headers } from "next/headers";
import { hashToken, randomToken } from "@/lib/crypto";
import { prisma } from "@/lib/db";
import { hashOtp, otpMatches, reviewOtp } from "@/lib/otp";
import { normalizePhone } from "@/lib/phone";
import { readSessionUserId } from "@/lib/session-user";
import { sendSms, smsDevMode } from "@/lib/sms";

async function clientIpHash() {
  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || headerStore.get("x-real-ip") || "local";
  return hashToken(ip);
}

export async function requestPhoneOtp(phoneInput: string) {
  const phone = normalizePhone(phoneInput);
  if (!phone) return { ok: false as const, error: "Enter a valid mobile number." };
  if (!process.env.AUTH_SECRET) return { ok: false as const, error: "Phone sign-in is not available right now." };
  const since = new Date(Date.now() - 15 * 60 * 1000);
  const ipHash = await clientIpHash();
  const [byPhone, byIp] = await Promise.all([
    prisma.otpChallenge.count({ where: { phoneE164: phone, createdAt: { gte: since } } }),
    prisma.otpChallenge.count({ where: { ipHash, createdAt: { gte: since } } }),
  ]);
  if (byPhone >= 3 || byIp >= 8) {
    return { ok: false as const, error: "Too many codes were requested. Wait a few minutes and try again." };
  }
  const code = String(randomInt(100000, 1000000));
  await prisma.otpChallenge.create({
    data: {
      phoneE164: phone,
      codeHash: hashOtp(phone, code, process.env.AUTH_SECRET),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      ipHash,
    },
  });
  try {
    await sendSms({ to: phone, body: `Your NMIET One code is ${code}. It expires in 5 minutes.` });
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Phone sign-in is not available right now." };
  }
  return { ok: true as const, phone, devCode: smsDevMode() ? code : null };
}

export async function verifyPhoneOtp(phoneInput: string, codeInput: string) {
  const phone = normalizePhone(phoneInput);
  const code = codeInput.trim();
  if (!phone || !/^\d{6}$/.test(code)) return { ok: false as const, error: "Enter the 6-digit code." };
  const secret = process.env.AUTH_SECRET;
  if (!secret) return { ok: false as const, error: "Phone sign-in is not available right now." };
  const challenge = await prisma.otpChallenge.findFirst({
    where: { phoneE164: phone, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!challenge) return { ok: false as const, error: "Request a code first." };
  const review = reviewOtp(challenge, otpMatches(phone, code, challenge.codeHash, secret));
  if (!review.ok) {
    if ("increment" in review && review.increment) {
      await prisma.otpChallenge.update({ where: { id: challenge.id }, data: { attempts: { increment: 1 } } });
    }
    return { ok: false as const, error: review.error };
  }
  const consumed = await prisma.otpChallenge.updateMany({
    where: { id: challenge.id, consumedAt: null, expiresAt: { gt: new Date() }, attempts: { lt: challenge.maxAttempts } },
    data: { consumedAt: new Date(), attempts: { increment: 1 } },
  });
  if (consumed.count !== 1) return { ok: false as const, error: "That code has expired or was already used. Request a new one." };

  const identity = await prisma.authIdentity.findUnique({
    where: { provider_providerAccountId: { provider: "phone", providerAccountId: phone } },
    include: { user: true },
  });
  const sessionUserId = await readSessionUserId();
  if (identity && sessionUserId && identity.userId !== sessionUserId) {
    return { ok: false as const, error: "This phone number is already connected to another account." };
  }
  if (identity?.user.status === "SUSPENDED") return { ok: false as const, error: "This account is suspended." };

  let userId = identity?.userId ?? null;
  if (!userId && sessionUserId) {
    await prisma.authIdentity.create({ data: { userId: sessionUserId, provider: "phone", providerAccountId: phone } });
    await prisma.studentProfile.updateMany({ where: { userId: sessionUserId }, data: { phone } });
    return { ok: true as const, linked: true as const };
  }
  if (!userId) {
    try {
      const created = await prisma.user.create({
        data: {
          name: "Student",
          role: "STUDENT",
          profile: { create: { college: "NMIET", phone } },
          identities: { create: { provider: "phone", providerAccountId: phone } },
        },
      });
      userId = created.id;
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
      const existing = await prisma.authIdentity.findUnique({
        where: { provider_providerAccountId: { provider: "phone", providerAccountId: phone } },
      });
      if (!existing) throw error;
      userId = existing.userId;
    }
  }
  const token = randomToken();
  await prisma.loginGrant.create({
    data: { userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 2 * 60 * 1000) },
  });
  return { ok: true as const, linked: false as const, token };
}
