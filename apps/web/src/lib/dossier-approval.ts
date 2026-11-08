import { EXTRACTED_FIELDS } from "./dossier-extraction.ts";
import type { OpportunityRecord, RequirementKind } from "../types/dossier.ts";
import type { ExtractionPreview } from "../types/dossier-extraction.ts";

export type MetadataKey = (typeof EXTRACTED_FIELDS)[number]["key"];
export type ApprovedMetadata = { field: MetadataKey; value: string; sourceExcerpt: string };
export type ApprovedTechnology = { value: string; sourceExcerpt: string };
export type ApprovedRequirement = { text: string; kind: RequirementKind; sourceExcerpt: string };
export type ReviewedApplyRequest = {
  confirmApply: true;
  sourceSha256: string;
  metadata: ApprovedMetadata[];
  technologies: ApprovedTechnology[];
  requirements: ApprovedRequirement[];
};
export type ReviewedApplyResult = {
  appliedMetadata: string[];
  skippedMetadata: string[];
  addedTechnologies: string[];
  skippedTechnologies: string[];
  addedRequirements: number;
  skippedRequirements: number;
  changed: boolean;
  record: OpportunityRecord;
};
export type ReviewedChoices = {
  metadata: Record<MetadataKey, { selected: boolean; value: string }>;
  technologies: { selected: boolean; value: string }[];
  requirements: { selected: boolean; text: string; kind: RequirementKind }[];
};

const MAX_METADATA: Record<MetadataKey, number> = {
  title: 200, company: 160, location: 200, employmentType: 60, salaryText: 240,
};

export function createReviewedChoices(preview: ExtractionPreview): ReviewedChoices {
  return {
    metadata: {
      title: { selected: false, value: preview.draft.title.value ?? "" },
      company: { selected: false, value: preview.draft.company.value ?? "" },
      location: { selected: false, value: preview.draft.location.value ?? "" },
      employmentType: { selected: false, value: preview.draft.employmentType.value ?? "" },
      salaryText: { selected: false, value: preview.draft.salaryText.value ?? "" },
    },
    technologies: preview.draft.technologies.map(({ value }) => ({ selected: false, value })),
    requirements: preview.draft.requirements.map(({ text, kind }) => ({ selected: false, text, kind })),
  };
}

export function equivalentText(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}

export function alreadyRecordedMetadata(record: OpportunityRecord, field: MetadataKey): boolean {
  const value = record[field];
  return typeof value === "string" && !!value.trim();
}

export function alreadyRecordedTechnology(record: OpportunityRecord, value: string): boolean {
  return record.technologies.some((saved) => equivalentText(saved) === equivalentText(value));
}

export function alreadyRecordedRequirement(record: OpportunityRecord, text: string, kind: RequirementKind): boolean {
  return record.requirements.some((saved) => saved.kind === kind && equivalentText(saved.text) === equivalentText(text));
}

/**
 * Client-side preflight only. The API revalidates all excerpts and applies changes
 * transactionally. Excerpts are taken from the verified preview, not editable input.
 */
export function planReviewedApproval(
  preview: ExtractionPreview,
  record: OpportunityRecord,
  choices: ReviewedChoices,
): { payload: ReviewedApplyRequest | null; error: string | null; skipped: string[] } {
  if (preview.opportunityId !== record.id || preview.saved !== false || preview.reviewRequired !== true) {
    return { payload: null, error: "This preview is not valid for the saved Dossier.", skipped: [] };
  }
  if (choices.technologies.length !== preview.draft.technologies.length ||
      choices.requirements.length !== preview.draft.requirements.length) {
    return { payload: null, error: "The reviewed selection no longer matches the preview.", skipped: [] };
  }
  const metadata: ApprovedMetadata[] = [];
  const technologies: ApprovedTechnology[] = [];
  const requirements: ApprovedRequirement[] = [];
  const skipped: string[] = [];
  for (const { key, label } of EXTRACTED_FIELDS) {
    const selection = choices.metadata[key];
    if (!selection?.selected) continue;
    if (alreadyRecordedMetadata(record, key)) {
      skipped.push(`${label}: manual value retained`);
      continue;
    }
    const excerpt = preview.draft[key].sourceExcerpt;
    const value = selection.value.trim();
    if (!excerpt || !record.sourceText.includes(excerpt) || !value || value.length > MAX_METADATA[key] ||
        !excerpt.toLocaleLowerCase("en-US").includes(value.toLocaleLowerCase("en-US"))) {
      return { payload: null, error: `${label} must appear in its exact supporting excerpt and fit the field limit.`, skipped };
    }
    metadata.push({ field: key, value, sourceExcerpt: excerpt });
  }
  const seenTechnologies = new Set(record.technologies.map(equivalentText));
  for (let i = 0; i < choices.technologies.length; i++) {
    const selection = choices.technologies[i];
    if (!selection.selected) continue;
    const value = selection.value.trim();
    const excerpt = preview.draft.technologies[i].sourceExcerpt;
    if (!value || value.length > 100 || !excerpt || excerpt.length > 1000 ||
        !record.sourceText.includes(excerpt) ||
        !excerpt.toLocaleLowerCase("en-US").includes(value.toLocaleLowerCase("en-US"))) {
      return { payload: null, error: `Technology ${i + 1} must have a name supported by its exact excerpt.`, skipped };
    }
    const key = equivalentText(value);
    if (seenTechnologies.has(key) || seenTechnologies.size >= 40) {
      skipped.push(`${value}: technology already present or limit reached`);
    } else {
      technologies.push({ value, sourceExcerpt: excerpt });
      seenTechnologies.add(key);
    }
  }
  const seenRequirements = new Set(record.requirements.map(({ text, kind }) => `${kind}:${equivalentText(text)}`));
  for (let i = 0; i < choices.requirements.length; i++) {
    const selection = choices.requirements[i];
    if (!selection.selected) continue;
    const text = selection.text.trim();
    const excerpt = preview.draft.requirements[i].sourceExcerpt;
    const kind = selection.kind;
    if (text.length < 2 || text.length > 2000 || !["required", "preferred"].includes(kind) ||
        !excerpt || excerpt.length > 2000 || !record.sourceText.includes(excerpt)) {
      return { payload: null, error: `Requirement ${i + 1} needs valid text, classification and its original exact source excerpt.`, skipped };
    }
    const key = `${kind}:${equivalentText(text)}`;
    if (seenRequirements.has(key)) {
      skipped.push(`Requirement ${i + 1}: already saved`);
    } else {
      requirements.push({ text, kind, sourceExcerpt: excerpt });
      seenRequirements.add(key);
    }
  }
  if (metadata.length + technologies.length + requirements.length === 0) {
    return { payload: null, error: "Select at least one new, source-supported suggestion to apply.", skipped };
  }
  if (technologies.length > 40 || requirements.length > 40) {
    return { payload: null, error: "Too many suggestions selected; apply a smaller group.", skipped };
  }
  return { payload: { confirmApply: true, sourceSha256: preview.sourceSha256, metadata, technologies, requirements }, error: null, skipped };
}
