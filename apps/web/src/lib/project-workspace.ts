import type { ProjectRecord, ProjectStatus } from "@/types/project";

/** Project detail routes are deliberately nested under existing URLs for compatibility. */
export function projectDetailsUrl(id: string): string {
  return `/armory/projects/${encodeURIComponent(id)}`;
}

export function projectStatusLabel(status: ProjectStatus): string {
  switch (status) {
    case "active": return "In progress";
    case "completed": return "Completed";
    case "paused": return "On hold";
  }
}

export function proofCountLabel(count: number): string {
  return `${count} evidence ${count === 1 ? "record" : "records"}`;
}

export function projectProofState(project: Pick<ProjectRecord, "evidence">): "supported" | "needs-proof" {
  return project.evidence.length > 0 ? "supported" : "needs-proof";
}
