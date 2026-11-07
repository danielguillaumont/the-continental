import type { EvidenceKind, EvidenceStatus } from "@/types/evidence";

export type ProjectStatus = "active" | "completed" | "paused";

export type ProjectWritePayload = {
  name: string;
  summary: string;
  repositoryUrl: string | null;
  status: ProjectStatus;
};

export type ProjectEvidence = {
  id: string;
  title: string;
  kind: EvidenceKind;
  status: EvidenceStatus;
};

export type ProjectRecord = ProjectWritePayload & {
  id: string;
  evidence: ProjectEvidence[];
  createdAt: string;
  updatedAt: string;
};
