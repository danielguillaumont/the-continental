import test from "node:test";
import assert from "node:assert/strict";
import {
  draftFromProfile, formatProfileDate, parseTargetRoles, profilePayload, safeExternalUrl, validateProfile,
} from "../src/lib/profile-workspace.ts";
import { activeDestination } from "../src/lib/primary-navigation.ts";

const blank = draftFromProfile(null);
const sample = {
  ...blank, fullName: "  Taylor   Rivera ", headline: "  Security Engineer ",
  email: " taylor@example.com ", targetRolesText: "Cloud Engineer\nSecurity Engineer\ncloud engineer\n",
};

test("Empty profile starts blank and does not invent user details", () => {
  assert.equal(blank.fullName, "");
  assert.equal(blank.email, "");
  assert.equal(blank.availableFrom, "");
  assert.deepEqual(profilePayload(blank).targetRoles, []);
});

test("Profile drafts trim optional strings and deduplicate role targets", () => {
  const result = profilePayload(sample);
  assert.equal(result.fullName, "Taylor   Rivera");
  assert.equal(result.headline, "Security Engineer");
  assert.equal(result.email, "taylor@example.com");
  assert.deepEqual(result.targetRoles, ["Cloud Engineer", "Security Engineer"]);
  assert.equal(result.phone, null);
  assert.equal(result.availableFrom, null);
  assert.equal(validateProfile(result), null);
});

test("Stored profile round-trips through editable fields", () => {
  const payload = profilePayload({ ...sample, availableFrom: "2027-01-04" });
  const rehydrated = draftFromProfile({ ...payload, createdAt: "2026-11-07T12:00:00Z", updatedAt: "2026-11-07T12:00:00Z" });
  assert.equal(rehydrated.targetRolesText, "Cloud Engineer\nSecurity Engineer");
  assert.equal(rehydrated.availableFrom, "2027-01-04");
  assert.deepEqual(profilePayload(rehydrated), payload);
});

test("Required name and field constraints are checked before API calls", () => {
  assert.match(validateProfile(profilePayload(blank)), /name/i);
  assert.match(validateProfile(profilePayload({ ...sample, fullName: "a" })), /name/i);
  assert.match(validateProfile(profilePayload({ ...sample, email: "broken" })), /email/i);
  assert.match(validateProfile(profilePayload({ ...sample, headline: "a".repeat(201) })), /headline/i);
  assert.match(validateProfile(profilePayload({ ...sample, professionalSummary: "a".repeat(4001) })), /summary/i);
});

test("Target roles enforce backend limit while preserving order", () => {
  assert.deepEqual(parseTargetRoles("DevOps\nSRE\ndevops"), ["DevOps", "SRE"]);
  assert.match(validateProfile(profilePayload({ ...sample, targetRolesText: Array.from({ length: 13 }, (_, i) => `Role ${i}`).join("\n") })), /12/);
  assert.match(validateProfile(profilePayload({ ...sample, targetRolesText: "x".repeat(121) })), /120/);
});

test("Only safe HTTP(S) URLs with no embedded credentials are linked", () => {
  assert.equal(safeExternalUrl("javascript:alert(1)"), null);
  assert.equal(safeExternalUrl("ftp://example.com"), null);
  assert.equal(safeExternalUrl("https://user:secret@example.com"), null);
  assert.equal(safeExternalUrl("not a url"), null);
  assert.equal(safeExternalUrl("https://example.com/"), "https://example.com/");
  assert.match(validateProfile(profilePayload({ ...sample, githubUrl: "javascript:alert(1)" })), /GitHub/i);
});

test("Availability dates reject impossible days and format in UTC", () => {
  assert.match(validateProfile(profilePayload({ ...sample, availableFrom: "2026-02-30" })), /date/i);
  assert.equal(formatProfileDate("2027-01-04"), "January 4, 2027");
  assert.equal(formatProfileDate(null), null);
});

test("Profile navigation is separate from every other existing destination", () => {
  assert.equal(activeDestination("/profile"), "profile");
  assert.equal(activeDestination("/armory"), "evidence");
  assert.equal(activeDestination("/certifications"), "certifications");
});
