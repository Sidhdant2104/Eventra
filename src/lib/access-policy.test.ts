import assert from "node:assert/strict";
import test from "node:test";
import { allows, canDelegate, type HeldGrant } from "./access-policy";

const hackathon: HeldGrant = { permission: "REGISTRATIONS_VIEW", scopeType: "EVENT", scopeId: "hackathon" };
const clubEdit: HeldGrant = { permission: "CLUB_EDIT", scopeType: "CLUB", scopeId: "coding" };
const delegate: HeldGrant = { permission: "DELEGATE", scopeType: "CLUB", scopeId: "coding" };

test("an event grant does not open another event", () => {
  const grants = [hackathon];
  assert.equal(allows(grants, "REGISTRATIONS_VIEW", { type: "EVENT", id: "hackathon", clubId: "coding" }), true);
  assert.equal(allows(grants, "REGISTRATIONS_VIEW", { type: "EVENT", id: "other", clubId: "coding" }), false);
  assert.equal(allows(grants, "EVENT_PAGE_EDIT", { type: "EVENT", id: "hackathon", clubId: "coding" }), false);
});

test("a club grant covers that club's events and not another club", () => {
  const grants = [clubEdit];
  assert.equal(allows(grants, "CLUB_EDIT", { type: "CLUB", id: "coding" }), true);
  assert.equal(allows(grants, "CLUB_EDIT", { type: "CLUB", id: "ecell" }), false);
  assert.equal(allows(grants, "CLUB_EDIT", { type: "EVENT", id: "hackathon", clubId: "coding" }), true);
  assert.equal(allows(grants, "CLUB_EDIT", { type: "EVENT", id: "pitch", clubId: "ecell" }), false);
});

test("delegation cannot escalate yourself or a permission you lack", () => {
  const grants = [delegate, clubEdit];
  assert.equal(canDelegate({ grants, actorId: "admin", subjectId: "admin", permission: "CLUB_EDIT", target: { type: "CLUB", id: "coding" } }).ok, false);
  assert.equal(canDelegate({ grants, actorId: "admin", subjectId: "riya", permission: "REGISTRATIONS_VIEW", target: { type: "EVENT", id: "hackathon", clubId: "coding" } }).ok, false);
  assert.equal(canDelegate({ grants, actorId: "admin", subjectId: "riya", permission: "CLUB_EDIT", target: { type: "CLUB", id: "coding" } }).ok, true);
  assert.equal(canDelegate({ grants: [], actorId: "lead", subjectId: "riya", permission: "CLUB_EDIT", target: { type: "CLUB", id: "coding" } }).ok, false);
});
