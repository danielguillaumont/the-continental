import type {
  OpportunityCreatePayload, OpportunityRecord, OpportunityWritePayload,
  RequirementKind, RequirementWritePayload,
} from "../types/dossier.ts";

export const dossierUrl = (id: string) => `/dossier/${encodeURIComponent(id)}`;

/** A URL must be usable without exposing credentials to the application. */
export function safeSourceUrl(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
    return url.toString();
  } catch { return null; }
}

export function parseTechnologies(text: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const candidate of text.split(/[,\n]/)) {
    const item = candidate.trim();
    if (!item) continue;
    const key = item.toLocaleLowerCase("en");
    if (!seen.has(key)) { seen.add(key); result.push(item); }
  }
  return result;
}

export function validateOpportunity(
  payload: OpportunityWritePayload | OpportunityCreatePayload,
): string | null {
  if ("sourceText" in payload && (payload.sourceText.trim().length < 20 || payload.sourceText.length > 100_000)) {
    return "Paste the original posting (at least 20 and at most 100,000 characters).";
  }
  const limits: [keyof OpportunityWritePayload, number, string][] = [
    ["title", 200, "Title"], ["company", 160, "Company"],
    ["location", 200, "Location"], ["employmentType", 60, "Employment type"],
    ["salaryText", 240, "Compensation"],
  ];
  for (const [field, max, label] of limits) {
    const value = payload[field];
    if (typeof value === "string" && value.length > max) return `${label} must be ${max} characters or less.`;
  }
  if (payload.sourceUrl && !safeSourceUrl(payload.sourceUrl)) {
    return "Posting URL must be an HTTP(S) address without embedded credentials.";
  }
  if (payload.technologies.length > 40) return "Use no more than 40 technology tags.";
  if (payload.technologies.some((tag) => !tag.trim() || tag.length > 100)) {
    return "Technology tags must be between 1 and 100 characters.";
  }
  return null;
}

export function validateRequirement(
  payload: RequirementWritePayload, originalSource: string,
): string | null {
  if (payload.kind !== "required" && payload.kind !== "preferred") return "Choose a requirement type.";
  if (payload.text.trim().length < 2 || payload.text.trim().length > 2000) {
    return "Requirement description must be 2-2,000 characters.";
  }
  if (payload.sourceExcerpt && (payload.sourceExcerpt.length > 2000 || !originalSource.includes(payload.sourceExcerpt))) {
    return "The source excerpt must appear exactly in the saved original posting.";
  }
  return null;
}

export function filterOpportunities(records: OpportunityRecord[], query: string): OpportunityRecord[] {
  const needle = query.trim().toLocaleLowerCase("en");
  if (!needle) return records;
  return records.filter((record) => [
    record.title ?? "", record.company ?? "", record.location ?? "",
    record.employmentType ?? "", ...record.technologies,
  ].some((field) => field.toLocaleLowerCase("en").includes(needle)));
}

export function opportunityLabel(record: OpportunityRecord): string {
  return record.title?.trim() || "Untitled opportunity";
}

export function requirementCount(record: OpportunityRecord, kind?: RequirementKind): number {
  return kind ? record.requirements.filter((item) => item.kind === kind).length : record.requirements.length;
}

export function dateLabel(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
}

/** Exact source + manually entered identity: never guess from a similar title. */
export function findExactSavedOpportunity(
  records: OpportunityRecord[], submitted: OpportunityCreatePayload,
): OpportunityRecord | null {
  const matches = records.filter((item) =>
    item.sourceText === submitted.sourceText &&
    item.title === submitted.title &&
    item.company === submitted.company &&
    item.location === submitted.location &&
    item.employmentType === submitted.employmentType &&
    item.sourceUrl === submitted.sourceUrl,
  );
  return matches.length === 1 ? matches[0] : null;
}
