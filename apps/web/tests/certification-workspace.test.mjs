import test from "node:test";
import assert from "node:assert/strict";
import {
  credentialStatus, credentialStatusLabels, credentialUrl, filterCertifications,
  formatCredentialDate, localToday, validateCertification,
} from "../src/lib/certification-workspace.ts";
import { activeDestination } from "../src/lib/primary-navigation.ts";

const sample = [
  { id: "a", name: "AWS Security", issuer: "Amazon", credentialId: "A1", description: null, expiresAt: "2026-01-01" },
  { id: "b", name: "Azure Fundamentals", issuer: "Microsoft", credentialId: null, description: "Cloud", expiresAt: "2026-07-10" },
  { id: "c", name: "Security+", issuer: "CompTIA", credentialId: null, description: null, expiresAt: null },
];

const valid = {
  name: "Security+", issuer: "CompTIA", credentialId: null, credentialUrl: null,
  issuedAt: "2026-01-01", expiresAt: "2028-01-01", description: null,
};

test("Expiration distinguishes expired, within 30 days, active and undated", () => {
  assert.equal(credentialStatus("2026-06-09", "2026-06-10"), "expired");
  assert.equal(credentialStatus("2026-06-10", "2026-06-10"), "expiring");
  assert.equal(credentialStatus("2026-07-10", "2026-06-10"), "expiring");
  assert.equal(credentialStatus("2026-07-11", "2026-06-10"), "active");
  assert.equal(credentialStatus(null, "2026-06-10"), "no-expiration");
});

test("Thirty day threshold crosses months and years", () => {
  assert.equal(credentialStatus("2027-01-14", "2026-12-15"), "expiring");
  assert.equal(credentialStatus("2027-01-15", "2026-12-15"), "active");
  assert.equal(credentialStatus("2024-03-01", "2024-01-31"), "expiring");
});

test("Local date helper does not infer a UTC date from a local timestamp", () => {
  assert.equal(localToday(new Date(2026, 9, 31, 23, 55, 0)), "2026-10-31");
});

test("Search includes credential name, issuer, ID, and description", () => {
  assert.deepEqual(filterCertifications(sample, " azure ", "all", "2026-06-10").map(x => x.id), ["b"]);
  assert.deepEqual(filterCertifications(sample, "COMP", "all", "2026-06-10").map(x => x.id), ["c"]);
  assert.deepEqual(filterCertifications(sample, "a1", "all", "2026-06-10").map(x => x.id), ["a"]);
  assert.deepEqual(filterCertifications(sample, "cloud", "all", "2026-06-10").map(x => x.id), ["b"]);
});

test("Status filter combines with search", () => {
  assert.deepEqual(filterCertifications(sample, "", "expired", "2026-06-10").map(x => x.id), ["a"]);
  assert.deepEqual(filterCertifications(sample, "", "expiring", "2026-06-10").map(x => x.id), ["b"]);
  assert.deepEqual(filterCertifications(sample, "", "no-expiration", "2026-06-10").map(x => x.id), ["c"]);
  assert.deepEqual(filterCertifications(sample, "azure", "expired", "2026-06-10"), []);
});

test("Validation requires a meaningful credential and issuer", () => {
  assert.match(validateCertification({ ...valid, name: "  " }), /name/i);
  assert.match(validateCertification({ ...valid, issuer: "x" }), /issuer/i);
  assert.equal(validateCertification(valid), null);
});

test("Dates, URL, and text limits are validated before API calls", () => {
  assert.match(validateCertification({ ...valid, expiresAt: "2025-01-01" }), /Expiration/i);
  assert.match(validateCertification({ ...valid, credentialUrl: "javascript:alert(1)" }), /URL/i);
  assert.match(validateCertification({ ...valid, credentialUrl: "not a link" }), /URL/i);
  assert.match(validateCertification({ ...valid, description: "x".repeat(2001) }), /Description/i);
  assert.equal(validateCertification({ ...valid, credentialUrl: "https://example.com/verify" }), null);
  assert.equal(validateCertification({ ...valid, expiresAt: null }), null);
});

test("Dates format independently of browser timezone", () => {
  assert.equal(formatCredentialDate(null), "Not recorded");
  assert.match(formatCredentialDate("2026-11-07"), /2026/);
});

test("Navigation and URLs do not collide with existing evidence routes", () => {
  assert.equal(credentialUrl("a/b"), "/certifications/a%2Fb");
  assert.equal(activeDestination("/certifications/a"), "certifications");
  assert.equal(activeDestination("/armory/a"), "evidence");
  assert.equal(activeDestination("/skills/a"), "skills");
});

test("Labels describe expiration, not third party verification", () => {
  assert.deepEqual(Object.keys(credentialStatusLabels), ["expired", "expiring", "active", "no-expiration"]);
  assert.doesNotMatch(credentialStatusLabels.active, /verified/i);
});
