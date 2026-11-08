import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  ATTRIBUTION_LABELS, attributionLabel, currentCitation, inspectSavedCitations,
} from "../src/lib/dossier-provenance.ts";

const sourceText = "Example Cloud seeks a Platform Engineer in Toronto. Required: Terraform and Python.";
const hash = createHash("sha256").update(sourceText).digest("hex");
const base = {
  id: "example-dossier", sourceText, company: "Example Cloud", title: "Platform Engineer",
  location: "Toronto", employmentType: null, salaryText: null,
  technologies: ["Terraform", "Python"],
  attributions: [],
};
const company = {
  id: "c1", kind: "metadata", field: "company", value: "Example Cloud",
  sourceExcerpt: "Example Cloud", sourceSha256: hash, createdAt: "2026-11-07T00:00:00Z",
};
const tech = {
  ...company, id: "c2", kind: "technology", field: "technologies", value: "Terraform",
  sourceExcerpt: "Terraform and Python",
};

test("approved metadata and technology citations survive a simulated reload", async () => {
  const saved = JSON.parse(JSON.stringify({ ...base, attributions: [company, tech] }));
  const result = await inspectSavedCitations(saved);
  assert.equal(result.fingerprintVerified, true);
  assert.equal(result.excludedCount, 0);
  assert.deepEqual(result.citations.map(({ id }) => id), ["c1", "c2"]);
  assert.equal(attributionLabel(tech), "Technology");
  assert.equal(ATTRIBUTION_LABELS.company, "Company");
});

test("legacy/manual records are never given invented citations", async () => {
  const result = await inspectSavedCitations({ ...base, attributions: [] });
  assert.deepEqual(result.citations, []);
  assert.equal(result.excludedCount, 0);
});

test("changed manual metadata and removed technology cannot retain their old labels", async () => {
  const changed = { ...base, company: "Corrected manually", technologies: ["Python"], attributions: [company, tech] };
  const result = await inspectSavedCitations(changed);
  assert.deepEqual(result.citations, []);
  assert.equal(result.excludedCount, 2);
});

test("fingerprint and exact source excerpt mismatch cause fail-closed hiding", async () => {
  const bad = { ...company, sourceSha256: "0".repeat(64) };
  const fake = { ...tech, id: "c3", sourceExcerpt: "Invented requirement" };
  const result = await inspectSavedCitations({ ...base, attributions: [bad, fake] });
  assert.equal(result.citations.length, 0);
  assert.equal(result.excludedCount, 2);
});

test("invalid kinds and mismatched cited value are not displayed", async () => {
  assert.equal(currentCitation(base, { ...company, kind: "unknown" }, hash), false);
  assert.equal(currentCitation(base, { ...company, field: "bogus" }, hash), false);
  assert.equal(currentCitation(base, { ...company, value: "Another Company" }, hash), false);
  assert.equal(currentCitation(base, { ...tech, value: "Kubernetes" }, hash), false);
  assert.equal(currentCitation(base, company, hash), true);
});
