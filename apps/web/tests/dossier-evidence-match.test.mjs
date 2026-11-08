import test from "node:test";
import assert from "node:assert/strict";
import {
  parseEvidenceMatchPreview, filterEvidenceMatchRequirements,
  evidenceMatchOutcomeLabel, evidenceMatchOutcomeExplanation,
} from "../src/lib/dossier-evidence-match.ts";

const requirement = (id, outcome) => ({
  id, text: `Requirement ${id}`, kind: "required", outcome,
  matchedSkills: [], evidenceCandidates: [], candidateCount: 0, truncated: false,
});
const requirements = [
  requirement("r1", "candidates_found"),
  requirement("r2", "no_linked_evidence"),
  requirement("r3", "no_explicit_skill_tag"),
];
const preview = {
  schemaVersion: "continental.v03.evidence-match.v1",
  mode: "deterministic_explicit_skill_tags",
  opportunityId: "opp1", opportunityTitle: "Cloud Security Engineer", caveat: "Not a qualification score.",
  summary: { totalRequirements: 3, candidatesFound: 1, noLinkedEvidence: 1, noExplicitSkillTag: 1 },
  requirements,
};

test("accepts the expected explicit skill-tag preview for the current Dossier", () => {
  assert.deepEqual(parseEvidenceMatchPreview(preview, "opp1"), preview);
});
test("rejects a preview from another opportunity", () => {
  assert.throws(() => parseEvidenceMatchPreview(preview, "opp2"), /unsupported response/);
});
test("fails closed on unsupported schema or a changed matching mode", () => {
  assert.throws(() => parseEvidenceMatchPreview({ ...preview, schemaVersion: "v2" }, "opp1"));
  assert.throws(() => parseEvidenceMatchPreview({ ...preview, mode: "ai_ranking" }, "opp1"));
});
test("rejects inconsistent totals and malformed candidates", () => {
  assert.throws(() => parseEvidenceMatchPreview({ ...preview, summary: { ...preview.summary, totalRequirements: 99 } }, "opp1"));
  const wrong = { ...requirements[0], evidenceCandidates: [{ id: "e1", title: "invented" }], candidateCount: 1 };
  assert.throws(() => parseEvidenceMatchPreview({ ...preview, requirements: [wrong, ...requirements.slice(1)] }, "opp1"));
});
test("candidate and review filters never turn missing matches into fit scores", () => {
  assert.deepEqual(filterEvidenceMatchRequirements(requirements, "all").map((item) => item.id), ["r1", "r2", "r3"]);
  assert.deepEqual(filterEvidenceMatchRequirements(requirements, "candidates").map((item) => item.id), ["r1"]);
  assert.deepEqual(filterEvidenceMatchRequirements(requirements, "review").map((item) => item.id), ["r2", "r3"]);
});
test("each outcome has a distinct, conservative human-readable meaning", () => {
  assert.notEqual(evidenceMatchOutcomeLabel("no_linked_evidence"), evidenceMatchOutcomeLabel("no_explicit_skill_tag"));
  assert.match(evidenceMatchOutcomeExplanation("candidates_found"), /does not establish proficiency/);
  assert.match(evidenceMatchOutcomeExplanation("no_explicit_skill_tag"), /not proof of a skills gap/);
});
test("accepts bounded evidence with linked project and experience context", () => {
  const candidate = {
    id: "e1", title: "Kubernetes test suite", kind: "project", ownerStatus: "unverified",
    sourceLabel: "Local demo", sourceUrl: null, matchedSkillIds: ["s1"],
    projects: [{ id: "p1", name: "Cluster Lab" }],
    experiences: [{ id: "x1", title: "Security Engineer", organization: "Example" }],
  };
  const found = { ...requirements[0], matchedSkills: [{ id: "s1", name: "Kubernetes", requirementPhrase: "Kubernetes" }],
    evidenceCandidates: [candidate], candidateCount: 1 };
  assert.deepEqual(parseEvidenceMatchPreview({ ...preview, requirements: [found, ...requirements.slice(1)] }, "opp1").requirements[0].evidenceCandidates[0], candidate);
});
