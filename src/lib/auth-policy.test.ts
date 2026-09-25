import assert from "node:assert/strict";
import test from "node:test";
import { canRemoveLoginMethod, decideOAuthSignIn } from "./auth-policy";
import { hashOtp, otpMatches, reviewOtp } from "./otp";
import { normalizePhone } from "./phone";
import { isProfileComplete, profileChecklist } from "./profile-completion";

test("normalizes Indian mobile numbers", () => {
  assert.equal(normalizePhone("9876543210"), "+919876543210");
  assert.equal(normalizePhone("+91 98765 43210"), "+919876543210");
  assert.equal(normalizePhone("12345"), null);
});

test("hashes OTP so the stored value is not the code", () => {
  const hash = hashOtp("+919876543210", "123456", "secret");
  assert.notEqual(hash, "123456");
  assert.equal(otpMatches("+919876543210", "123456", hash, "secret"), true);
  assert.equal(otpMatches("+919876543210", "000000", hash, "secret"), false);
});

test("rejects expired and exhausted OTP attempts", () => {
  const base = { expiresAt: new Date(Date.now() + 60_000), attempts: 0, maxAttempts: 5, consumedAt: null };
  assert.equal(reviewOtp(base, true).ok, true);
  assert.equal(reviewOtp({ ...base, expiresAt: new Date(Date.now() - 1000) }, true).ok, false);
  const exhausted = reviewOtp({ ...base, attempts: 5 }, false);
  assert.equal(exhausted.ok, false);
  if (!exhausted.ok) assert.match(exhausted.error, /Too many attempts/);
  assert.equal(reviewOtp(base, false).ok, false);
});

test("does not silently merge an OAuth login into an existing email", () => {
  const decision = decideOAuthSignIn({
    sessionUserId: null,
    linkedUserId: null,
    verifiedEmail: "student@nmiet.edu.in",
    existingUserId: "user_1",
    existingEmailVerified: true,
  });
  assert.deepEqual(decision, { action: "link-required", email: "student@nmiet.edu.in" });
});

test("rejects an unverified email collision and a taken provider", () => {
  assert.equal(decideOAuthSignIn({
    sessionUserId: null,
    linkedUserId: null,
    verifiedEmail: "student@nmiet.edu.in",
    existingUserId: "user_1",
    existingEmailVerified: false,
  }).action, "reject");
  const taken = decideOAuthSignIn({
    sessionUserId: "user_2",
    linkedUserId: "user_1",
    verifiedEmail: null,
    existingUserId: null,
    existingEmailVerified: false,
  });
  assert.equal(taken.action, "reject");
  if (taken.action === "reject") assert.equal(taken.error, "provider-taken");
});

test("logs in when the provider is already linked", () => {
  assert.equal(decideOAuthSignIn({
    sessionUserId: null,
    linkedUserId: "user_1",
    verifiedEmail: "student@nmiet.edu.in",
    existingUserId: "user_1",
    existingEmailVerified: true,
  }).action, "continue");
});

test("profile completion ignores optional fields and blocks a placeholder name", () => {
  const incomplete = { name: "Student", image: null, profile: { college: "NMIET", department: null, year: null, division: null, rollNumber: null } };
  assert.equal(isProfileComplete(incomplete), false);
  const ready = { name: "Aarav Mehta", image: null, profile: { college: "NMIET", department: "Computer Engineering", year: "TE", division: "A", rollNumber: "TECOA041", skills: null, linkedin: null } };
  assert.equal(isProfileComplete(ready), true);
  assert.equal(profileChecklist(ready).percent < 100, true);
});

test("refuses to remove the last login method", () => {
  assert.equal(canRemoveLoginMethod({ methods: 1, hasPassword: false }), false);
  assert.equal(canRemoveLoginMethod({ methods: 1, hasPassword: true }), true);
});
