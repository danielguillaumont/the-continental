import type { SkillDetail, SkillSummary } from "@/types/skill";
import type { ExperienceRecord, ExperienceWritePayload } from "@/types/experience";
import type { ProjectRecord, ProjectWritePayload } from "@/types/project";
import type {
  EvidenceKind,
  EvidenceRecord,
  EvidenceStatus,
} from "@/types/evidence";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export type EvidenceWritePayload = {
  kind: EvidenceKind;
  title: string;
  description: string;
  skills: string[];
  status: EvidenceStatus;
  source?: {
    label: string;
    url?: string;
  };
  occurredAt?: string;
};

async function getErrorMessage(response: Response) {
  try {
    const body = await response.json();

    if (typeof body.detail === "string") {
      return body.detail;
    }

    if (body.detail) {
      return "The API rejected this request.";
    }
  } catch {
    // Fall through to the generic message.
  }

  return `Request failed with status ${response.status}.`;
}

export async function createEvidence(
  payload: EvidenceWritePayload,
): Promise<EvidenceRecord> {
  const response = await fetch(`${API_BASE_URL}/evidence`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
}

export async function updateEvidence(
  evidenceId: string,
  payload: EvidenceWritePayload,
): Promise<EvidenceRecord> {
  const response = await fetch(
    `${API_BASE_URL}/evidence/${evidenceId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
}

export async function deleteEvidence(
  evidenceId: string,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/evidence/${evidenceId}`,
    {
      method: "DELETE",
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
}

export async function listEvidence(): Promise<EvidenceRecord[]> {
  const response = await fetch(`${API_BASE_URL}/evidence`);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
}

export async function getEvidence(
  evidenceId: string,
): Promise<EvidenceRecord> {
  const response = await fetch(
    `${API_BASE_URL}/evidence/${evidenceId}`,
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
}

async function readProjectResponse(response: Response): Promise<ProjectRecord> {
  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
  return response.json();
}

export async function listProjects(): Promise<ProjectRecord[]> {
  const response = await fetch(`${API_BASE_URL}/projects`);
  if (!response.ok) throw new Error(await getErrorMessage(response));
  return response.json();
}

export async function getProject(id: string): Promise<ProjectRecord> {
  return readProjectResponse(await fetch(`${API_BASE_URL}/projects/${encodeURIComponent(id)}`));
}

export async function createProject(payload: ProjectWritePayload): Promise<ProjectRecord> {
  return readProjectResponse(await fetch(`${API_BASE_URL}/projects`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }));
}

export async function updateProject(id: string, payload: ProjectWritePayload): Promise<ProjectRecord> {
  return readProjectResponse(await fetch(`${API_BASE_URL}/projects/${id}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }));
}

export async function deleteProject(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/projects/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error(await getErrorMessage(response));
}

export async function attachProjectEvidence(projectId: string, evidenceId: string): Promise<ProjectRecord> {
  return readProjectResponse(await fetch(
    `${API_BASE_URL}/projects/${projectId}/evidence/${evidenceId}`,
    { method: "POST" },
  ));
}

export async function detachProjectEvidence(projectId: string, evidenceId: string): Promise<ProjectRecord> {
  return readProjectResponse(await fetch(
    `${API_BASE_URL}/projects/${projectId}/evidence/${evidenceId}`,
    { method: "DELETE" },
  ));
}

// Experience Registry: these relationships never transfer ownership of projects or evidence.
async function readExperienceResponse(response: Response): Promise<ExperienceRecord> {
  if (!response.ok) throw new Error(await getErrorMessage(response));
  return response.json();
}

export async function listExperiences(): Promise<ExperienceRecord[]> {
  const response = await fetch(`${API_BASE_URL}/experiences`);
  if (!response.ok) throw new Error(await getErrorMessage(response));
  return response.json();
}

export async function getExperience(id: string): Promise<ExperienceRecord> {
  return readExperienceResponse(await fetch(`${API_BASE_URL}/experiences/${encodeURIComponent(id)}`));
}

export async function createExperience(payload: ExperienceWritePayload): Promise<ExperienceRecord> {
  return readExperienceResponse(await fetch(`${API_BASE_URL}/experiences`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  }));
}

export async function updateExperience(id: string, payload: ExperienceWritePayload): Promise<ExperienceRecord> {
  return readExperienceResponse(await fetch(`${API_BASE_URL}/experiences/${encodeURIComponent(id)}`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  }));
}

export async function deleteExperience(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/experiences/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!response.ok) throw new Error(await getErrorMessage(response));
}

export async function attachExperienceProject(id: string, projectId: string): Promise<ExperienceRecord> {
  return readExperienceResponse(await fetch(`${API_BASE_URL}/experiences/${encodeURIComponent(id)}/projects/${encodeURIComponent(projectId)}`, { method: "POST" }));
}

export async function detachExperienceProject(id: string, projectId: string): Promise<ExperienceRecord> {
  return readExperienceResponse(await fetch(`${API_BASE_URL}/experiences/${encodeURIComponent(id)}/projects/${encodeURIComponent(projectId)}`, { method: "DELETE" }));
}

export async function attachExperienceEvidence(id: string, evidenceId: string): Promise<ExperienceRecord> {
  return readExperienceResponse(await fetch(`${API_BASE_URL}/experiences/${encodeURIComponent(id)}/evidence/${encodeURIComponent(evidenceId)}`, { method: "POST" }));
}

export async function detachExperienceEvidence(id: string, evidenceId: string): Promise<ExperienceRecord> {
  return readExperienceResponse(await fetch(`${API_BASE_URL}/experiences/${encodeURIComponent(id)}/evidence/${encodeURIComponent(evidenceId)}`, { method: "DELETE" }));
}


// Read-only Skill & Proof endpoints. Skill edits occur through saved Evidence.
export async function listSkills(): Promise<SkillSummary[]> {
  const response = await fetch(`${API_BASE_URL}/skills`, { cache: "no-store" });
  if (!response.ok) throw new Error(await getErrorMessage(response));
  return response.json();
}

export async function getSkill(id: string): Promise<SkillDetail> {
  const response = await fetch(`${API_BASE_URL}/skills/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (!response.ok) throw new Error(await getErrorMessage(response));
  return response.json();
}
