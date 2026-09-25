export type OAuthDecision =
  | { action: "continue" }
  | { action: "link-required"; email: string }
  | { action: "reject"; error: "provider-taken" | "unverified-email" | "suspended" };

export function decideOAuthSignIn(input: {
  sessionUserId: string | null;
  linkedUserId: string | null;
  linkedStatus?: "ACTIVE" | "SUSPENDED" | null;
  verifiedEmail: string | null;
  existingUserId: string | null;
  existingEmailVerified: boolean;
  existingStatus?: "ACTIVE" | "SUSPENDED" | null;
}) {
  if (input.linkedStatus === "SUSPENDED" || input.existingStatus === "SUSPENDED") {
    return { action: "reject", error: "suspended" } satisfies OAuthDecision;
  }
  if (input.linkedUserId) {
    if (input.sessionUserId && input.sessionUserId !== input.linkedUserId) {
      return { action: "reject", error: "provider-taken" } satisfies OAuthDecision;
    }
    return { action: "continue" } satisfies OAuthDecision;
  }
  if (input.sessionUserId) return { action: "continue" } satisfies OAuthDecision;
  if (!input.verifiedEmail || !input.existingUserId) return { action: "continue" } satisfies OAuthDecision;
  if (!input.existingEmailVerified) return { action: "reject", error: "unverified-email" } satisfies OAuthDecision;
  return { action: "link-required", email: input.verifiedEmail } satisfies OAuthDecision;
}

export function canRemoveLoginMethod(input: { methods: number; hasPassword: boolean }) {
  return input.methods + (input.hasPassword ? 1 : 0) > 1;
}
