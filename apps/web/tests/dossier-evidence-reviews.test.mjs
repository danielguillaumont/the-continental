import test from "node:test";
import assert from "node:assert/strict";
import {
  parseEvidenceReviewOptions, parseEvidenceReviewRecord, parseEvidenceReviews,
  reviewDecisionLabel, reviewPairKey, validateEvidenceReviewWrite,
} from "../src/lib/dossier-evidence-reviews.ts";

const opp = "opportunity-1";
const fingerprint = "a".repeat(64);
const review = {
  id: "review-1", requirementId: "req-1", evidenceId: "e-1",
  decision: "supports", note: "Contains actual CI control validation.",
  requirementTextAtReview: "Build secure CI controls",
  evidenceTitleAtReview: "CI control test run",
  reviewStatus: "current", currentCandidate: true,
  createdAt: "2026-11-08T10:00:00Z", updatedAt: "2026-11-08T10:00:00Z",
};
const options = {
  schemaVersion: "continental.v03.review-options.v1", opportunityId: opp,
  candidates: [
    { requirementId: "req-1", evidenceId: "e-1", evidenceTitle: "CI control test run", fingerprint, currentReview: review },
  ],
  truncatedRequirementIds: [], caveat: "Owner judgment only, not verification.",
};
const collection = {
  schemaVersion: "continental.v03.reviews.v1", opportunityId: opp, reviews: [review],
};

test("accepts exact versioned review-option and saved-review contracts", () => {
  assert.deepEqual(parseEvidenceReviewOptions(options, opp), options);
  assert.deepEqual(parseEvidenceReviews(collection, opp), collection);
});
test("empty review collections and unreviewed candidates are legitimate", () => {
  assert.deepEqual(parseEvidenceReviews({ ...collection, reviews: [] }, opp).reviews, []);
  const unreviewed = { ...options, candidates: [{ ...options.candidates[0], currentReview: null }] };
  assert.equal(parseEvidenceReviewOptions(unreviewed, opp).candidates[0].currentReview, null);
});
test("rejects a different opportunity or unsupported API schema", () => {
  assert.throws(() => parseEvidenceReviewOptions(options, "other"), /Unsupported/);
  assert.throws(() => parseEvidenceReviews(collection, "other"), /Unsupported/);
  assert.throws(() => parseEvidenceReviewOptions({ ...options, schemaVersion: "v2" }, opp), /Unsupported/);
});
test("rejects missing or invalid source fingerprints", () => {
  assert.throws(() => parseEvidenceReviewOptions({ ...options, candidates: [{ ...options.candidates[0], fingerprint: "broken" }] }, opp));
  assert.throws(() => parseEvidenceReviewOptions({ ...options, candidates: [{ ...options.candidates[0], fingerprint: "B".repeat(64) }] }, opp));
});
test("rejects duplicate evidence pairs and review decisions", () => {
  assert.throws(() => parseEvidenceReviewOptions({ ...options, candidates: [options.candidates[0], options.candidates[0]] }, opp));
  assert.throws(() => parseEvidenceReviews({ ...collection, reviews: [review, review] }, opp));
});
test("rejects mismatched nested review associations", () => {
  assert.throws(() => parseEvidenceReviewOptions({ ...options, candidates: [{ ...options.candidates[0], currentReview: { ...review, evidenceId: "other" } }] }, opp));
  assert.throws(() => parseEvidenceReviewRecord(review, "req-1", "different"));
});
test("accepts an explicitly stale, previously saved review", () => {
  const stale = { ...review, reviewStatus: "stale", currentCandidate: false };
  assert.equal(parseEvidenceReviews({ ...collection, reviews: [stale] }, opp).reviews[0].reviewStatus, "stale");
});
test("rejects fabricated review statuses, decisions and missing fields", () => {
  assert.throws(() => parseEvidenceReviews({ ...collection, reviews: [{ ...review, reviewStatus: "validated" }] }, opp));
  assert.throws(() => parseEvidenceReviews({ ...collection, reviews: [{ ...review, decision: "certified" }] }, opp));
  assert.throws(() => parseEvidenceReviews({ ...collection, reviews: [{ ...review, id: null }] }, opp));
});
test("requires a meaningful explanation for supports but not rejection", () => {
  assert.match(validateEvidenceReviewWrite({ decision: "supports", note: "tiny", expectedFingerprint: fingerprint }), /10 characters/);
  assert.equal(validateEvidenceReviewWrite({ decision: "supports", note: "Detailed link to work", expectedFingerprint: fingerprint }), null);
  assert.equal(validateEvidenceReviewWrite({ decision: "not_relevant", note: "", expectedFingerprint: fingerprint }), null);
});
test("rejects overlong notes and stale fingerprint on save", () => {
  assert.match(validateEvidenceReviewWrite({ decision: "supports", note: "x".repeat(1201), expectedFingerprint: fingerprint }), /1,200/);
  assert.match(validateEvidenceReviewWrite({ decision: "supports", note: "Detailed explanation", expectedFingerprint: "broken" }), /Refresh/);
});
test("decision labels make no independent verification claim", () => {
  assert.match(reviewDecisionLabel("supports"), /Owner marked/);
  assert.match(reviewDecisionLabel("not_relevant"), /Owner marked/);
  assert.doesNotMatch(reviewDecisionLabel("supports"), /verified|fit score|AI/i);
});
test("pair identity is stable and scoped to both records", () => {
  assert.equal(reviewPairKey("r1", "e1"), "r1:e1");
  assert.notEqual(reviewPairKey("r2", "e1"), reviewPairKey("r1", "e1"));
});
