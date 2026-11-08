import test from "node:test";
import { withDossierTimeout, DossierTimeoutError, DossierHttpError } from "../src/lib/dossier-request.ts";
import assert from "node:assert/strict";
import {
  dossierUrl, safeSourceUrl, parseTechnologies, validateOpportunity, findExactSavedOpportunity,
  validateRequirement, filterOpportunities, opportunityLabel, requirementCount, dateLabel,
} from "../src/lib/dossier-workspace.ts";

const base = {
  title: "Cloud Security Engineer", company: "Acme", location: "Toronto",
  employmentType: "Full-time", salaryText: null, sourceUrl: null,
  technologies: ["Go", "Kubernetes"],
};
const source = "We seek a Cloud Security Engineer with Kubernetes experience. AWS familiarity is preferred.";
const record = { ...base, id: "123", sourceText: source, requirements: [
  { id: "req1", kind: "required", text: "Kubernetes", position: 0 },
  { id: "req2", kind: "preferred", text: "AWS", position: 1 },
], createdAt: "2026-11-07T00:00:00Z", updatedAt: "2026-11-07T00:00:00Z", extractionStatus: "not_run" };

test("Dossier URLs preserve encoded IDs", () => {
  assert.equal(dossierUrl("id /?"), "/dossier/id%20%2F%3F");
});
test("Only safe HTTP(S) URLs without credentials can be used as source links", () => {
  assert.equal(safeSourceUrl("https://jobs.example.com/role"), "https://jobs.example.com/role");
  assert.equal(safeSourceUrl("javascript:alert(1)"), null);
  assert.equal(safeSourceUrl("https://user:secret@jobs.example.com"), null);
  assert.equal(safeSourceUrl("file:///C:/foo"), null);
  assert.equal(safeSourceUrl(""), null);
});
test("Technology tags are trimmed, deduplicated and retain first spelling", () => {
  assert.deepEqual(parseTechnologies("Go, kubernetes, Go\nTerraform, KUBERNETES,,"), ["Go", "kubernetes", "Terraform"]);
});
test("Original source text is required but never normalized or trimmed", () => {
  assert.equal(validateOpportunity({ ...base, sourceText: " short " }), "Paste the original posting (at least 20 and at most 100,000 characters).");
  assert.equal(validateOpportunity({ ...base, sourceText: `  ${source}\n` }), null);
});
test("Missing compensation remains null, not a guessed value", () => {
  assert.equal(validateOpportunity(base), null);
  assert.equal(base.salaryText, null);
});
test("User URLs and field limits are validated before API submission", () => {
  assert.match(validateOpportunity({ ...base, title: "a".repeat(201) }) ?? "", /Title/);
  assert.match(validateOpportunity({ ...base, sourceUrl: "http://u:p@example.com" }) ?? "", /HTTP/);
  assert.match(validateOpportunity({ ...base, technologies: Array.from({ length: 41 }, (_, i) => `t${i}`) }) ?? "", /40/);
});
test("An exact source excerpt is accepted and a fabricated excerpt is rejected", () => {
  assert.equal(validateRequirement({ kind: "required", text: "Kubernetes", sourceExcerpt: "Kubernetes experience" }, source), null);
  assert.match(validateRequirement({ kind: "required", text: "Kubernetes", sourceExcerpt: "invented experience" }, source) ?? "", /exactly/);
});
test("Classification and descriptions are validated", () => {
  assert.match(validateRequirement({ kind: "required", text: " ", sourceExcerpt: null }, source) ?? "", /2-2,000/);
  assert.equal(validateRequirement({ kind: "preferred", text: "AWS", sourceExcerpt: null }, source), null);
});
test("Registry search includes company, title, location and technologies", () => {
  const records = [record, { ...record, id: "456", company: "Other", title: "QA", technologies: ["Python"], location: "Vancouver" }];
  for (const term of ["acme", "security", "tORONto", "KUBERNETES"]) {
    assert.deepEqual(filterOpportunities(records, term).map((r) => r.id), ["123"]);
  }
  assert.equal(filterOpportunities(records, "not-present").length, 0);
});
test("Requirement counts do not infer qualification or matching scores", () => {
  assert.equal(requirementCount(record), 2);
  assert.equal(requirementCount(record, "required"), 1);
  assert.equal(requirementCount(record, "preferred"), 1);
  assert.equal(opportunityLabel({ ...record, title: null }), "Untitled opportunity");
});
test("Unknown dates are handled without crashing", () => {
  assert.equal(dateLabel("not-a-date"), "Date unavailable");
});

test("Dossier request deadline ends a stalled operation and aborts its signal", async () => {
  let requestSignal;
  await assert.rejects(
    withDossierTimeout((signal) => { requestSignal = signal; return new Promise(() => {}); }, 12),
    DossierTimeoutError,
  );
  assert.equal(requestSignal.aborted, true);
});

test("Dossier request returns successful results without changing them", async () => {
  const value = { id: "saved" };
  assert.equal(await withDossierTimeout(async () => value, 50), value);
});

test("Dossier request preserves non-timeout errors", async () => {
  await assert.rejects(withDossierTimeout(async () => { throw new Error("API 422"); }, 50), /API 422/);
});

test("A timed-out save is reconciled only with one exact original posting", () => {
  const submission = { ...base, sourceText: source };
  assert.equal(findExactSavedOpportunity([record], submission)?.id, "123");
  assert.equal(findExactSavedOpportunity([{ ...record, sourceText: source + " " }], submission), null);
  assert.equal(findExactSavedOpportunity([{ ...record, company: "Different" }], submission), null);
  assert.equal(findExactSavedOpportunity([record, { ...record, id: "duplicate" }], submission), null);
});

test("Dossier HTTP rejection keeps the status for safe validation handling", () => {
  const rejected = new DossierHttpError("Invalid requirement", 422);
  assert.equal(rejected.status, 422);
  assert.match(rejected.message, /Invalid requirement/);
});
