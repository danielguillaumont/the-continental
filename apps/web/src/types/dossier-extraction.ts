/** Read-only extraction preview contract from Slice 2C1. Not a saved opportunity. */
export type GroundedField = {
  value: string | null;
  sourceExcerpt: string | null;
};

export type ExtractedTechnology = {
  value: string;
  sourceExcerpt: string;
};

export type ExtractedRequirement = {
  text: string;
  kind: "required" | "preferred";
  sourceExcerpt: string;
};

export type ExtractedDraft = {
  title: GroundedField;
  company: GroundedField;
  location: GroundedField;
  employmentType: GroundedField;
  salaryText: GroundedField;
  technologies: ExtractedTechnology[];
  requirements: ExtractedRequirement[];
};

export type ExtractionPreview = {
  opportunityId: string;
  sourceSha256: string;
  provider: "openai";
  model: string;
  promptVersion: string;
  reviewRequired: true;
  saved: false;
  draft: ExtractedDraft;
};
