import { createHmac, timingSafeEqual } from "crypto";

export function hashOtp(phone: string, code: string, secret: string) {
  return createHmac("sha256", secret).update(`${phone}:${code}`).digest("hex");
}

export function otpMatches(phone: string, code: string, codeHash: string, secret: string) {
  const next = hashOtp(phone, code, secret);
  const left = Buffer.from(next);
  const right = Buffer.from(codeHash);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export type OtpState = {
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  consumedAt: Date | null;
  now?: Date;
};

export function reviewOtp(state: OtpState, matches: boolean) {
  const now = state.now ?? new Date();
  if (state.consumedAt) return { ok: false as const, error: "This code has already been used. Request a new one." };
  if (state.expiresAt.getTime() <= now.getTime()) return { ok: false as const, error: "That code has expired. Request a new one." };
  if (state.attempts >= state.maxAttempts) return { ok: false as const, error: "Too many attempts. Request a new code." };
  if (!matches) {
    const remaining = state.maxAttempts - (state.attempts + 1);
    return {
      ok: false as const,
      error: remaining > 0 ? "That code is incorrect." : "Too many attempts. Request a new code.",
      increment: true as const,
    };
  }
  return { ok: true as const };
}
