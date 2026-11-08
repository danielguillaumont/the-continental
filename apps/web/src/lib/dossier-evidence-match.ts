import type {
  EvidenceMatchOutcome,
  EvidenceMatchPreview,
  EvidenceMatchRequirement,
} from "../types/dossier-evidence-match.ts";

export type EvidenceMatchFilter = "all" | "candidates" | "review";

const outcomes: EvidenceMatchOutcome[] = [
  "candidates_found", "no_linked_evidence", "no_explicit_skill_tag",
];

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const nonnegativeInt = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

/** Fail closed if this client receives a different API version or malformed shape. */
export function parseEvidenceMatchPreview(value: unknown, opportunityId: string): EvidenceMatchPreview {
  if (!isObject(value) || value.schemaVersion !== "continental.v03.evidence-match.v1" ||
      value.mode !== "deterministic_explicit_skill_tags" || value.opportunityId !== opportunityId ||
      !isObject(value.summary) || !Array.isArray(value.requirements) || typeof value.caveat !== "string") {
    throw new Error("Evidence Match returned an unsupported response. Refresh or check the API version.");
  }
  const summary = value.summary;
  if (!nonnegativeInt(summary.totalRequirements) ||
      !nonnegativeInt(summary.candidatesFound) ||
      !nonnegativeInt(summary.noLinkedEvidence) ||
      !nonnegativeInt(summary.noExplicitSkillTag) ||
      summary.totalRequirements !== value.requirements.length ||
    summary.candidatesFound + summary.noLinkedEvidence + summary.noExplicitSkillTag !== summary.totalRequirements) {
    throw new Error("Evidence Match summary is inconsistent. No results are displayed.");
  }
  for (const requirement of value.requirements) {
    if (!isObject(requirement) || typeof requirement.id !== "string" || typeof requirement.text !== "string" ||
        !["required", "preferred"].includes(String(requirement.kind)) ||
        !outcomes.includes(requirement.outcome as EvidenceMatchOutcome) ||
        !Array.isArray(requirement.matchedSkills) || !Array.isArray(requirement.evidenceCandidates) ||
        !nonnegativeInt(requirement.candidateCount) || typeof requirement.truncated !== "boolean" ||
        requirement.evidenceCandidates.length > requirement.candidateCount) {
      throw new Error("Evidence Match requirements are malformed. No results are displayed.");
    }
    if (requirement.matchedSkills.some((skill: unknown) => !isObject(skill) ||
        typeof skill.id !== "string" || typeof skill.name !== "string" || typeof skill.requirementPhrase !== "string")) {
      throw new Error("Evidence Match returned invalid matched skill data.");
    }
    if (requirement.evidenceCandidates.some((candidate: unknown) => !isObject(candidate) ||
        typeof candidate.id !== "string" || typeof candidate.title !== "string" ||
        typeof candidate.kind !== "string" || !["verified", "unverified"].includes(String(candidate.ownerStatus)) ||
        !Array.isArray(candidate.matchedSkillIds) || !Array.isArray(candidate.projects) ||
        !Array.isArray(candidate.experiences) ||
        (candidate.sourceLabel !== null && typeof candidate.sourceLabel !== "string") ||
        (candidate.sourceUrl !== null && typeof candidate.sourceUrl !== "string") ||
        candidate.projects.some((project: unknown) => !isObject(project) || typeof project.id !== "string" || typeof project.name !== "string") ||
        candidate.experiences.some((experience: unknown) => !isObject(experience) || typeof experience.id !== "string" || typeof experience.title !== "string" || typeof experience.organization !== "string"))) {
      throw new Error("Evidence Match returned invalid candidate evidence data.");
    }
  }
  return value as EvidenceMatchPreview;
}

export function filterEvidenceMatchRequirements(
  requirements: EvidenceMatchRequirement[], filter: EvidenceMatchFilter,
): EvidenceMatchRequirement[] {
  if (filter === "candidates") return requirements.filter((item) => item.outcome === "candidates_found");
  if (filter === "review") return requirements.filter((item) => item.outcome !== "candidates_found");
  return requirements;
}

export function evidenceMatchOutcomeLabel(outcome: EvidenceMatchOutcome): string {
  switch (outcome) {
    case "candidates_found": return "Evidence to inspect";
    case "no_linked_evidence": return "No linked evidence";
    case "no_explicit_skill_tag": return "Needs interpretation";
  }
}

export function evidenceMatchOutcomeExplanation(outcome: EvidenceMatchOutcome): string {
  switch (outcome) {
    case "candidates_found":
      return "A saved skill tag appears in this requirement, and evidence linked to that skill is available for review. The association does not establish proficiency or job fit.";
    case "no_linked_evidence":
      return "A saved skill was recognized in this requirement, but there is no evidence attached to that skill. You can link a relevant existing record in the Evidence library.";
    case "no_explicit_skill_tag":
      return "No saved skill tag was recognized literally in this requirement. This is not proof of a skills gap; review the wording and your career evidence manually.";
  }
}
