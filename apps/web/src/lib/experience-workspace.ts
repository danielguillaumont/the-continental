import type { EmploymentType, ExperienceRecord, ExperienceWritePayload } from "../types/experience.ts";

export const employmentLabels: Record<EmploymentType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
  freelance: "Freelance",
  volunteer: "Volunteer",
  other: "Other",
};

export function experienceUrl(id: string): string {
  return `/experiences/${encodeURIComponent(id)}`;
}

export function formatExperienceDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(value);
  if (!match) return value;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return value;
  return `${new Intl.DateTimeFormat("en-CA", { month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1)))} ${year}`;
}

export function experiencePeriod(record: Pick<ExperienceRecord, "startDate" | "endDate">): string {
  return `${formatExperienceDate(record.startDate)} – ${record.endDate ? formatExperienceDate(record.endDate) : "Present"}`;
}

export function isCurrentExperience(record: Pick<ExperienceRecord, "endDate">): boolean {
  return record.endDate === null;
}

export function experienceProofCount(record: Pick<ExperienceRecord, "evidence" | "projects">): number {
  return record.projects.length + record.evidence.length;
}

export function filterExperiences(records: ExperienceRecord[], query: string): ExperienceRecord[] {
  const search = query.trim().toLocaleLowerCase();
  if (!search) return records;
  return records.filter((record) => [record.organization, record.title, record.location ?? ""]
    .some((value) => value.toLocaleLowerCase().includes(search)));
}

export function parseHighlights(value: string): string[] {
  return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

export function validateExperience(payload: ExperienceWritePayload): string | null {
  if (!payload.organization.trim() || !payload.title.trim()) return "Add an employer or organization and a role title.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.startDate) || !isRealDate(payload.startDate)) return "Enter a valid start date.";
  if (payload.endDate && !isRealDate(payload.endDate)) return "Enter a valid end date.";
  if (payload.endDate && payload.endDate < payload.startDate) return "The end date cannot be before the start date.";
  if (payload.description.trim().length < 10) return "Describe your work in at least 10 characters.";
  if (payload.description.length > 3000) return "Keep the description within 3,000 characters.";
  if (payload.highlights.length > 12) return "Add no more than 12 accomplishments.";
  if (payload.highlights.some((item) => item.length < 3 || item.length > 300)) return "Each accomplishment must be 3–300 characters.";
  if (new Set(payload.highlights.map((item) => item.toLocaleLowerCase())).size !== payload.highlights.length) return "Remove duplicate accomplishments.";
  return null;
}

function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
