import type { EvidenceKind, EvidenceStatus } from "@/types/evidence";

export type SkillCoverage = "verified" | "unverified" | "unsupported";

export type SkillSummary = {
  id: string;
  name: string;
  normalizedName: string;
  evidenceCount: number;
  verifiedCount: number;
  unverifiedCount: number;
  coverage: SkillCoverage;
};

export type SkillEvidence = {
  id: string;
  title: string;
  kind: EvidenceKind;
  description: string;
  status: EvidenceStatus;
  sourceLabel: string | null;
  sourceUrl: string | null;
  occurredAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SkillDetail = SkillSummary & {
  evidence: SkillEvidence[];
};
