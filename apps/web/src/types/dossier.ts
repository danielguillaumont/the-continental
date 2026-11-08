/** Dossier Slice 2B: owner-entered opportunity records; AI extraction is not active. */
export type RequirementKind = "required" | "preferred";
export type ExtractionStatus = "not_run" | "completed" | "failed";

export type RequirementRecord = {
  id: string;
  position: number;
  kind: RequirementKind;
  text: string;
  sourceExcerpt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RequirementWritePayload = {
  kind: RequirementKind;
  text: string;
  sourceExcerpt: string | null;
};

export type OpportunityWritePayload = {
  title: string | null;
  company: string | null;
  location: string | null;
  employmentType: string | null;
  salaryText: string | null;
  sourceUrl: string | null;
  technologies: string[];
};

export type OpportunityCreatePayload = OpportunityWritePayload & {
  sourceText: string;
};

export type OpportunityAttribution = {
  id: string;
  kind: "metadata" | "technology";
  field: string;
  value: string;
  sourceExcerpt: string;
  sourceSha256: string;
  createdAt: string;
};

export type OpportunityRecord = OpportunityCreatePayload & {
  id: string;
  extractionProvider: string | null;
  extractionModel: string | null;
  extractionPromptVersion: string | null;
  extractionStatus: ExtractionStatus;
  requirements: RequirementRecord[];
  attributions: OpportunityAttribution[];
  createdAt: string;
  updatedAt: string;
};
