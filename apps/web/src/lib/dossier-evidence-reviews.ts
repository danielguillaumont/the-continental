import type {
  EvidenceReviewCollection,
  EvidenceReviewDecision,
  EvidenceReviewOption,
  EvidenceReviewOptions,
  EvidenceReviewRecord,
  EvidenceReviewWrite,
} from "../types/dossier-evidence-review.ts";

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const nonempty = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const isDecision = (value: unknown): value is EvidenceReviewDecision =>
  value === "supports" || value === "not_relevant";

function invalid(): never {
  throw new Error("Unsupported Evidence Review response. Refresh or check the API version.");
}

function parseReview(value: unknown): EvidenceReviewRecord {
  if (!isObject(value) ||
    !nonempty(value.id) || !nonempty(value.requirementId) ||
    !nonempty(value.evidenceId) || !isDecision(value.decision) ||
    typeof value.note !== "string" ||
    typeof value.requirementTextAtReview !== "string" ||
    typeof value.evidenceTitleAtReview !== "string" ||
    (value.reviewStatus !== "current" && value.reviewStatus !== "stale") ||
    typeof value.currentCandidate !== "boolean" ||
    !nonempty(value.createdAt) || !nonempty(value.updatedAt)) invalid();
  return value as EvidenceReviewRecord;
}

export function parseEvidenceReviewRecord(value: unknown, requirementId: string, evidenceId: string): EvidenceReviewRecord {
  const review = parseReview(value);
  if (review.requirementId !== requirementId || review.evidenceId !== evidenceId) invalid();
  return review;
}

export function parseEvidenceReviewOptions(value: unknown, opportunityId: string): EvidenceReviewOptions {
  if (!isObject(value) || value.schemaVersion !== "continental.v03.review-options.v1" ||
    value.opportunityId !== opportunityId || !Array.isArray(value.candidates) ||
    !Array.isArray(value.truncatedRequirementIds) || !nonempty(value.caveat) ||
    !value.truncatedRequirementIds.every(nonempty)) invalid();
  const keys = new Set<string>();
  const candidates: EvidenceReviewOption[] = [];
  for (const candidate of value.candidates) {
    if (!isObject(candidate) || !nonempty(candidate.requirementId) ||
      !nonempty(candidate.evidenceId) || !nonempty(candidate.evidenceTitle) ||
      typeof candidate.fingerprint !== "string" ||
      !/^[a-f0-9]{64}$/.test(candidate.fingerprint)) invalid();
    const key = reviewPairKey(candidate.requirementId, candidate.evidenceId);
    if (keys.has(key)) invalid();
    keys.add(key);
    if (candidate.currentReview !== null && candidate.currentReview !== undefined) {
      parseEvidenceReviewRecord(candidate.currentReview, candidate.requirementId, candidate.evidenceId);
    } else if (candidate.currentReview === undefined) invalid();
    candidates.push(candidate as EvidenceReviewOption);
  }
  return { schemaVersion: "continental.v03.review-options.v1", opportunityId,
    candidates, truncatedRequirementIds: value.truncatedRequirementIds as string[], caveat: value.caveat as string };
}

export function parseEvidenceReviews(value: unknown, opportunityId: string): EvidenceReviewCollection {
  if (!isObject(value) || value.schemaVersion !== "continental.v03.reviews.v1" ||
    value.opportunityId !== opportunityId || !Array.isArray(value.reviews)) invalid();
  const keys = new Set<string>();
  const reviews = value.reviews.map((entry: unknown) => {
    const review = parseReview(entry);
    const key = reviewPairKey(review.requirementId, review.evidenceId);
    if (keys.has(key)) invalid();
    keys.add(key);
    return review;
  });
  return { schemaVersion: "continental.v03.reviews.v1", opportunityId, reviews };
}

export function reviewPairKey(requirementId: string, evidenceId: string): string {
  return `${requirementId}:${evidenceId}`;
}

export function reviewDecisionLabel(decision: EvidenceReviewDecision): string {
  return decision === "supports" ? "Owner marked as supporting" : "Owner marked not relevant";
}

export function validateEvidenceReviewWrite(payload: EvidenceReviewWrite): string | null {
  if (!isDecision(payload.decision)) return "Choose a review decision.";
  if (!/^[a-f0-9]{64}$/.test(payload.expectedFingerprint)) return "Refresh review options first.";
  if (payload.note.length > 1200) return "Keep the explanation within 1,200 characters.";
  if (payload.decision === "supports" && payload.note.trim().length < 10) {
    return "Explain how this evidence supports the requirement (at least 10 characters).";
  }
  return null;
}
