import type { SkillCoverage, SkillSummary } from "../types/skill.ts";

export const skillCoverageLabels: Record<SkillCoverage, string> = {
  verified: "Verified evidence present",
  unverified: "Unverified evidence only",
  unsupported: "No linked evidence",
};

/** Status is based on saved evidence records, not a fabricated skill score. */
export function filterSkills(
  skills: SkillSummary[],
  query: string,
  coverage: SkillCoverage | "all" = "all",
): SkillSummary[] {
  const needle = query.trim().toLocaleLowerCase();
  return skills.filter((skill) =>
    (coverage === "all" || skill.coverage === coverage) &&
    (!needle || skill.name.toLocaleLowerCase().includes(needle))
  );
}

export function skillUrl(id: string): string {
  return `/skills/${encodeURIComponent(id)}`;
}

export function countSkillCoverage(skills: SkillSummary[], coverage: SkillCoverage): number {
  return skills.filter((skill) => skill.coverage === coverage).length;
}

export function proofCountLabel(count: number): string {
  return `${count} evidence ${count === 1 ? "record" : "records"}`;
}
