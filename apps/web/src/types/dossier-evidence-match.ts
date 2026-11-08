/** v0.3: literal-skill candidate discovery. These are NOT qualification scores. */
export type EvidenceMatchOutcome =
  | "candidates_found"
  | "no_linked_evidence"
  | "no_explicit_skill_tag";

export type EvidenceMatchSkill = {
  id: string;
  name: string;
  requirementPhrase: string;
};

export type EvidenceMatchCandidate = {
  id: string;
  title: string;
  kind: string;
  ownerStatus: "verified" | "unverified";
  sourceLabel: string | null;
  sourceUrl: string | null;
  matchedSkillIds: string[];
  projects: { id: string; name: string }[];
  experiences: { id: string; title: string; organization: string }[];
};

export type EvidenceMatchRequirement = {
  id: string;
  text: string;
  kind: "required" | "preferred";
  outcome: EvidenceMatchOutcome;
  matchedSkills: EvidenceMatchSkill[];
  evidenceCandidates: EvidenceMatchCandidate[];
  candidateCount: number;
  truncated: boolean;
};

export type EvidenceMatchPreview = {
  schemaVersion: "continental.v03.evidence-match.v1";
  mode: "deterministic_explicit_skill_tags";
  opportunityId: string;
  opportunityTitle: string | null;
  summary: {
    totalRequirements: number;
    candidatesFound: number;
    noLinkedEvidence: number;
    noExplicitSkillTag: number;
  };
  requirements: EvidenceMatchRequirement[];
  caveat: string;
};
