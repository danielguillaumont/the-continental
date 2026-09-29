export type EvidenceKind =
  | "project"
  | "experience"
  | "certification"
  | "education"
  | "artifact";

export type EvidenceStatus =
  | "verified"
  | "unverified";

export type EvidenceSource = {
  label: string;
  url?: string | null;
};

export type EvidenceRecord = {
  id: string;
  kind: EvidenceKind;
  title: string;
  description: string;
  skills: string[];
  status: EvidenceStatus;
  source?: EvidenceSource | null;
  occurredAt?: string | null;
  createdAt: string;
  updatedAt: string;
};