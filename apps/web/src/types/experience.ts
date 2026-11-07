import type { ProjectEvidence, ProjectStatus } from "@/types/project";

export type EmploymentType =
  | "full_time"
  | "part_time"
  | "contract"
  | "internship"
  | "freelance"
  | "volunteer"
  | "other";

export type ExperienceWritePayload = {
  organization: string;
  title: string;
  employmentType: EmploymentType | null;
  location: string | null;
  startDate: string;
  endDate: string | null;
  description: string;
  highlights: string[];
};

export type ExperienceProject = {
  id: string;
  name: string;
  status: ProjectStatus;
};

export type ExperienceRecord = ExperienceWritePayload & {
  id: string;
  projects: ExperienceProject[];
  evidence: ProjectEvidence[];
  createdAt: string;
  updatedAt: string;
};
