import type { ExtractedDraft, ExtractionPreview, GroundedField } from "../types/dossier-extraction.ts";

export const MAX_EXTRACTION_SOURCE_LENGTH = 30_000;

export const EXTRACTED_FIELDS: ReadonlyArray<{key: keyof Pick<ExtractedDraft, "title" | "company" | "location" | "employmentType" | "salaryText">; label: string}> = [
  { key: "title", label: "Position title" },
  { key: "company", label: "Company" },
  { key: "location", label: "Location" },
  { key: "employmentType", label: "Employment type" },
  { key: "salaryText", label: "Compensation" },
];

export function previewEligibility(sourceText: string): string | null {
  if (!sourceText) return "This Dossier has no original posting to analyze.";
  if (sourceText.length > MAX_EXTRACTION_SOURCE_LENGTH) {
    return `This posting has ${sourceText.length.toLocaleString("en-CA")} characters; AI preview supports at most 30,000.`;
  }
  return null;
}

export function groundedExcerptExists(field: GroundedField, sourceText: string): boolean {
  if (field.value === null && field.sourceExcerpt === null) return true;
  return typeof field.value === "string" && !!field.value.trim() &&
    typeof field.sourceExcerpt === "string" && !!field.sourceExcerpt.trim() &&
    sourceText.includes(field.sourceExcerpt);
}

/**
 * Check that the response belongs to this exact original posting, and that all
 * cited excerpts are literal substrings. This is defense in depth in addition
 * to the API's authoritative Pydantic/source checks.
 */
export async function verifyExtractionPreview(
  preview: ExtractionPreview,
  record: { id: string; sourceText: string },
): Promise<string | null> {
  if (!preview || preview.opportunityId !== record.id || preview.saved !== false || preview.reviewRequired !== true) {
    return "The extraction response does not belong to this Dossier or is not review-only.";
  }
  if (!preview.draft || !Array.isArray(preview.draft.technologies) || !Array.isArray(preview.draft.requirements)) {
    return "The extraction response is incomplete.";
  }
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) return "This browser cannot verify the original posting fingerprint.";
  const digest = await subtle.digest("SHA-256", new TextEncoder().encode(record.sourceText));
  const hash = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  if (hash !== preview.sourceSha256) return "The original posting does not match this AI preview. Refresh the Dossier.";

  for (const field of EXTRACTED_FIELDS) {
    if (!groundedExcerptExists(preview.draft[field.key], record.sourceText)) {
      return `The suggested ${field.label.toLowerCase()} has no exact source support.`;
    }
  }
  for (const tech of preview.draft.technologies) {
    if (!tech.value.trim() || !record.sourceText.includes(tech.sourceExcerpt) ||
        !tech.sourceExcerpt.toLowerCase().includes(tech.value.toLowerCase())) {
      return "A suggested technology is not supported by an exact source excerpt.";
    }
  }
  for (const requirement of preview.draft.requirements) {
    if (!requirement.text.trim() || !["required", "preferred"].includes(requirement.kind) ||
        !requirement.sourceExcerpt.trim() || !record.sourceText.includes(requirement.sourceExcerpt)) {
      return "A suggested requirement is not supported by an exact source excerpt.";
    }
  }
  return null;
}
