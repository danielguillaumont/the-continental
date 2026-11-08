import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { EXTRACTED_FIELDS, MAX_EXTRACTION_SOURCE_LENGTH, groundedExcerptExists, previewEligibility, verifyExtractionPreview } from "../src/lib/dossier-extraction.ts";

const source = "Acme seeks a Platform Engineer in Toronto. Required: Kubernetes and Python. Preferred: Terraform. Salary: $120,000.";
const hash = createHash("sha256").update(source, "utf8").digest("hex");
const record = { id: "valid-id", sourceText: source };
const field = (value, sourceExcerpt) => ({ value, sourceExcerpt });
function preview() {
  return {
    opportunityId: record.id, sourceSha256: hash, provider: "openai", model: "configured-test-model",
    promptVersion: "dossier-v02-2c1", reviewRequired: true, saved: false,
    draft: {
      title: field("Platform Engineer", "Platform Engineer"),
      company: field("Acme", "Acme"),
      location: field("Toronto", "Toronto"),
      employmentType: field(null, null),
      salaryText: field("$120,000", "Salary: $120,000"),
      technologies: [{ value: "Kubernetes", sourceExcerpt: "Kubernetes and Python" }],
      requirements: [
        { text: "Experience with Kubernetes", kind: "required", sourceExcerpt: "Required: Kubernetes and Python" },
        { text: "Terraform experience", kind: "preferred", sourceExcerpt: "Preferred: Terraform" },
      ],
    },
  };
}

test("preview checks source length without transmitting the text", () => {
  assert.equal(previewEligibility(source), null);
  assert.match(previewEligibility("") ?? "", /no original posting/);
  assert.equal(MAX_EXTRACTION_SOURCE_LENGTH, 30_000);
  assert.match(previewEligibility("a".repeat(30_001)) ?? "", /30,000/);
});
test("supported extracted metadata fields stay stable", () => {
  assert.deepEqual(EXTRACTED_FIELDS.map((item) => item.key), ["title", "company", "location", "employmentType", "salaryText"]);
});
test("grounding requires both a value and verbatim excerpt", () => {
  assert.equal(groundedExcerptExists(field(null, null), source), true);
  assert.equal(groundedExcerptExists(field("Acme", "Acme"), source), true);
  assert.equal(groundedExcerptExists(field("Acme", null), source), false);
  assert.equal(groundedExcerptExists(field(null, "Acme"), source), false);
  assert.equal(groundedExcerptExists(field("Acme", "acme"), source), false);
});
test("a valid review-only preview matches the exact posting fingerprint", async () => {
  assert.equal(await verifyExtractionPreview(preview(), record), null);
});
test("preview refuses a different opportunity or saved result", async () => {
  assert.match(await verifyExtractionPreview({ ...preview(), opportunityId: "other" }, record), /does not belong/);
  assert.match(await verifyExtractionPreview({ ...preview(), saved: true }, record), /review-only/);
});
test("preview refuses a mismatched source hash", async () => {
  assert.match(await verifyExtractionPreview({ ...preview(), sourceSha256: "0".repeat(64) }, record), /original posting does not match/);
});
test("preview rejects invented metadata excerpts and unsupported technologies", async () => {
  const a = preview(); a.draft.title.sourceExcerpt = "Not actually present";
  assert.match(await verifyExtractionPreview(a, record), /position title/);
  const b = preview(); b.draft.technologies[0].value = "Docker";
  assert.match(await verifyExtractionPreview(b, record), /suggested technology/);
});
test("preview rejects fabricated requirement excerpts", async () => {
  const a = preview(); a.draft.requirements[0].sourceExcerpt = "Fabricated source evidence";
  assert.match(await verifyExtractionPreview(a, record), /suggested requirement/);
});
test("review preview may legitimately have no extracted facts", async () => {
  const a = preview();
  for (const key of EXTRACTED_FIELDS.map((item) => item.key)) a.draft[key] = field(null, null);
  a.draft.technologies = []; a.draft.requirements = [];
  assert.equal(await verifyExtractionPreview(a, record), null);
});
