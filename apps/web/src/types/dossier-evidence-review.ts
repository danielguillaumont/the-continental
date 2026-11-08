/** v0.3: owner decisions are not independent verification or job-fit scoring. */
export type EvidenceReviewDecision = "supports" | "not_relevant";
export type EvidenceReviewStatus = "current" | "stale";

export type EvidenceReviewRecord = {
  id: string;
  requirementId: string;
  evidenceId: string;
  decision: EvidenceReviewDecision;
  note: string;
  requirementTextAtReview: string;
  evidenceTitleAtReview: string;
  reviewStatus: EvidenceReviewStatus;
  currentCandidate: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EvidenceReviewOption = {
  requirementId: string;
  evidenceId: string;
  evidenceTitle: string;
  fingerprint: string;
  currentReview: EvidenceReviewRecord | null;
};

export type EvidenceReviewOptions = {
  schemaVersion: "continental.v03.review-options.v1";
  opportunityId: string;
  candidates: EvidenceReviewOption[];
  truncatedRequirementIds: string[];
  caveat: string;
};

export type EvidenceReviewCollection = {
  schemaVersion: "continental.v03.reviews.v1";
  opportunityId: string;
  reviews: EvidenceReviewRecord[];
};

export type EvidenceReviewWrite = {
  decision: EvidenceReviewDecision;
  note: string;
  expectedFingerprint: string;
};
