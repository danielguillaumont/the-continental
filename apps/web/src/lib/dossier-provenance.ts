import type { OpportunityAttribution, OpportunityRecord } from "../types/dossier.ts";

/** Persisted owner-reviewed citations, never independent employer verification. */
export type CitationInspection = {
  citations: OpportunityAttribution[];
  excludedCount: number;
  fingerprintVerified: boolean;
};

export type AttributedMetadataField = "title" | "company" | "location" | "employmentType" | "salaryText";

export const ATTRIBUTION_LABELS: Record<AttributedMetadataField, string> = {
  title: "Position title",
  company: "Company",
  location: "Location",
  employmentType: "Employment type",
  salaryText: "Compensation",
};

export function attributionLabel(citation: OpportunityAttribution): string {
  if (citation.kind === "technology") return "Technology";
  if (Object.prototype.hasOwnProperty.call(ATTRIBUTION_LABELS, citation.field)) {
    return ATTRIBUTION_LABELS[citation.field as AttributedMetadataField];
  }
  return "Opportunity detail";
}

/** Check a citation still describes a displayed value, not a manually changed one. */
export function currentCitation(
  record: OpportunityRecord,
  citation: OpportunityAttribution,
  sourceHash: string,
): boolean {
  if (!/^[a-f0-9]{64}$/.test(sourceHash) || citation.sourceSha256 !== sourceHash) return false;
  if (!citation.sourceExcerpt?.trim() || !record.sourceText.includes(citation.sourceExcerpt)) return false;
  if (!citation.value?.trim() || !citation.id?.trim()) return false;

  if (citation.kind === "metadata") {
    if (!Object.prototype.hasOwnProperty.call(ATTRIBUTION_LABELS, citation.field)) return false;
    const field = citation.field as AttributedMetadataField;
    return record[field] === citation.value &&
      citation.sourceExcerpt.toLocaleLowerCase().includes(citation.value.toLocaleLowerCase());
  }
  return citation.kind === "technology" && citation.field === "technologies" &&
    record.technologies.includes(citation.value) &&
    citation.sourceExcerpt.toLocaleLowerCase().includes(citation.value.toLocaleLowerCase());
}

/**
 * Verify the saved original text in the browser before displaying stored citations.
 * A missing WebCrypto verifier fails closed; no source claim is displayed.
 */
export async function inspectSavedCitations(record: OpportunityRecord): Promise<CitationInspection> {
  const existing = record.attributions ?? [];
  if (existing.length === 0) return { citations: [], excludedCount: 0, fingerprintVerified: true };

  if (!globalThis.crypto?.subtle) {
    return { citations: [], excludedCount: existing.length, fingerprintVerified: false };
  }
  try {
    const digest = await globalThis.crypto.subtle.digest(
      "SHA-256", new TextEncoder().encode(record.sourceText),
    );
    const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    const citations = existing.filter((citation) => currentCitation(record, citation, hash));
    return {
      citations,
      excludedCount: existing.length - citations.length,
      fingerprintVerified: true,
    };
  } catch {
    return { citations: [], excludedCount: existing.length, fingerprintVerified: false };
  }
}
