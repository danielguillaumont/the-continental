import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  createReviewedChoices, planReviewedApproval, equivalentText,
  alreadyRecordedMetadata, alreadyRecordedRequirement, alreadyRecordedTechnology,
} from "../src/lib/dossier-approval.ts";

const source = "Acme seeks a Platform Engineer in Toronto. Required: Kubernetes and Python. Preferred: Terraform. Salary: $120,000.";
const preview = {
  opportunityId: "dossier-1", sourceSha256: createHash("sha256").update(source).digest("hex"),
  saved: false, reviewRequired: true, provider: "openai", model: "test", promptVersion: "2c1",
  draft: {
    title: { value: "Platform Engineer", sourceExcerpt: "Platform Engineer" },
    company: { value: "Acme", sourceExcerpt: "Acme" },
    location: { value: "Toronto", sourceExcerpt: "Toronto" },
    employmentType: { value: null, sourceExcerpt: null },
    salaryText: { value: "$120,000", sourceExcerpt: "Salary: $120,000" },
    technologies: [{ value: "Kubernetes", sourceExcerpt: "Kubernetes and Python" }, { value: "Python", sourceExcerpt: "Kubernetes and Python" }],
    requirements: [
      { text: "Experience with Kubernetes", kind: "required", sourceExcerpt: "Required: Kubernetes and Python" },
      { text: "Terraform experience", kind: "preferred", sourceExcerpt: "Preferred: Terraform" },
    ],
  },
};
const record = {
  id: "dossier-1", sourceText: source, title: "Owner edited title", company: null,
  location: null, employmentType: null, salaryText: null, technologies: ["Python"], requirements: [
    { text: "Kubernetes experience", kind: "required" },
  ],
};
function setup() { return createReviewedChoices(preview); }

test("nothing is automatically selected and empty approval is refused", () => {
  const choices = setup();
  assert.equal(choices.metadata.title.selected, false);
  assert.ok(choices.technologies.every((item) => !item.selected));
  assert.ok(choices.requirements.every((item) => !item.selected));
  const plan = planReviewedApproval(preview, record, choices);
  assert.equal(plan.payload, null);
  assert.match(plan.error, /at least one new/);
});
test("only explicitly chosen empty metadata fields are included", () => {
  const choices = setup();
  choices.metadata.company.selected = true;
  choices.metadata.title.selected = true;
  const plan = planReviewedApproval(preview, record, choices);
  assert.deepEqual(plan.payload?.metadata, [{ field: "company", value: "Acme", sourceExcerpt: "Acme" }]);
  assert.equal(plan.payload?.confirmApply, true);
  assert.equal(plan.payload?.sourceSha256, preview.sourceSha256);
  assert.match(plan.skipped.join(), /manual value retained/);
});
test("metadata corrections must be literal in their cited excerpt", () => {
  const choices = setup();
  choices.metadata.company.selected = true;
  choices.metadata.company.value = "Unmentioned LLC";
  assert.match(planReviewedApproval(preview, record, choices).error, /exact supporting excerpt/);
  choices.metadata.company.value = " ACME ";
  assert.equal(planReviewedApproval(preview, record, choices).payload.metadata[0].value, "ACME");
});
test("tech names require original support and deduplicate against manual data", () => {
  const choices = setup();
  choices.technologies[0].selected = true;
  choices.technologies[1].selected = true;
  const plan = planReviewedApproval(preview, record, choices);
  assert.deepEqual(plan.payload?.technologies, [{ value: "Kubernetes", sourceExcerpt: "Kubernetes and Python" }]);
  assert.match(plan.skipped.join(), /Python: technology already present/);
  choices.technologies[0].value = "Ruby";
  assert.match(planReviewedApproval(preview, record, choices).error, /exact excerpt/);
});
test("approved requirements can be corrected without changing exact citation", () => {
  const choices = setup();
  choices.requirements[1].selected = true;
  choices.requirements[1].text = "Familiarity with Terraform";
  choices.requirements[1].kind = "preferred";
  const plan = planReviewedApproval(preview, record, choices);
  assert.deepEqual(plan.payload?.requirements, [{ text: "Familiarity with Terraform", kind: "preferred", sourceExcerpt: "Preferred: Terraform" }]);
  choices.requirements[1].kind = "other";
  assert.match(planReviewedApproval(preview, record, choices).error, /classification/);
});
test("existing qualifications are skipped if selected", () => {
  const choices = setup();
  choices.requirements[0].selected = true;
  choices.requirements[0].text = " KUBERNETES   EXPERIENCE ";
  const plan = planReviewedApproval(preview, record, choices);
  assert.equal(plan.payload, null);
  assert.match(plan.skipped.join(), /already saved/);
});
test("rejects stale preview identity, changed selection shape, and edited source excerpts", () => {
  const choices = setup();
  choices.metadata.company.selected = true;
  assert.match(planReviewedApproval({ ...preview, opportunityId: "other" }, record, choices).error, /not valid/);
  assert.match(planReviewedApproval({ ...preview, saved: true }, record, choices).error, /not valid/);
  assert.match(planReviewedApproval(preview, record, { ...choices, technologies: [] }).error, /no longer matches/);
  const changedPreview = { ...preview, draft: { ...preview.draft, company: { value: "Acme", sourceExcerpt: "Imaginary source" } } };
  assert.match(planReviewedApproval(changedPreview, record, choices).error, /exact supporting excerpt/);
});
test("bounds and empty corrections fail before the write", () => {
  const choices = setup();
  choices.metadata.company.selected = true;
  choices.metadata.company.value = "";
  assert.match(planReviewedApproval(preview, record, choices).error, /exact supporting excerpt/);
  choices.metadata.company.selected = false;
  choices.requirements[0].selected = true;
  choices.requirements[0].text = "x";
  assert.match(planReviewedApproval(preview, record, choices).error, /valid text/);
});
test("duplicates use consistent case and whitespace normalization", () => {
  assert.equal(equivalentText("   KUBE   RN   "), "kube rn");
  assert.equal(alreadyRecordedMetadata(record, "title"), true);
  assert.equal(alreadyRecordedMetadata(record, "location"), false);
  assert.equal(alreadyRecordedTechnology(record, "python"), true);
  assert.equal(alreadyRecordedRequirement(record, " Kubernetes     Experience ", "required"), true);
  assert.equal(alreadyRecordedRequirement(record, "Kubernetes experience", "preferred"), false);
});
test("selected fields, technologies and qualifications compile as one opt-in batch", () => {
  const choices = setup();
  choices.metadata.company.selected = true;
  choices.technologies[0].selected = true;
  choices.requirements[1].selected = true;
  const payload = planReviewedApproval(preview, record, choices).payload;
  assert.equal(payload?.metadata.length, 1);
  assert.equal(payload?.technologies.length, 1);
  assert.equal(payload?.requirements.length, 1);
  assert.ok(!("sourceText" in payload));
  assert.ok(!("provider" in payload));
});
