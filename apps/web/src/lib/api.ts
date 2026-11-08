import type { OpportunityCreatePayload, OpportunityRecord, OpportunityWritePayload, RequirementRecord, RequirementWritePayload } from "@/types/dossier";
import { DossierHttpError, withDossierTimeout } from "@/lib/dossier-request";
import type { ProfileRecord, ProfileWritePayload } from "@/types/profile";
import type { CertificationRecord, CertificationWritePayload } from "@/types/certification";
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

// Certifications are independent owner-entered records. Relationships never transfer ownership.
async function readCertification(response: Response): Promise<CertificationRecord> {
  if (!response.ok) throw new Error(await getErrorMessage(response));
  return response.json();
}

export async function listCertifications(): Promise<CertificationRecord[]> {
  const response = await fetch(`${API_BASE_URL}/certifications`, { cache: "no-store" });
  if (!response.ok) throw new Error(await getErrorMessage(response));
  return response.json();
}

export async function getCertification(id: string): Promise<CertificationRecord> {
  return readCertification(await fetch(`${API_BASE_URL}/certifications/${encodeURIComponent(id)}`, { cache: "no-store" }));
}

export async function createCertification(payload: CertificationWritePayload): Promise<CertificationRecord> {
  return readCertification(await fetch(`${API_BASE_URL}/certifications`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  }));
}

export async function updateCertification(id: string, payload: CertificationWritePayload): Promise<CertificationRecord> {
  return readCertification(await fetch(`${API_BASE_URL}/certifications/${encodeURIComponent(id)}`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  }));
}

export async function deleteCertification(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/certifications/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!response.ok) throw new Error(await getErrorMessage(response));
}

export async function attachCertificationSkill(id: string, skillId: string): Promise<CertificationRecord> {
  return readCertification(await fetch(`${API_BASE_URL}/certifications/${encodeURIComponent(id)}/skills/${encodeURIComponent(skillId)}`, { method: "POST" }));
}

export async function detachCertificationSkill(id: string, skillId: string): Promise<CertificationRecord> {
  return readCertification(await fetch(`${API_BASE_URL}/certifications/${encodeURIComponent(id)}/skills/${encodeURIComponent(skillId)}`, { method: "DELETE" }));
}

export async function attachCertificationEvidence(id: string, evidenceId: string): Promise<CertificationRecord> {
  return readCertification(await fetch(`${API_BASE_URL}/certifications/${encodeURIComponent(id)}/evidence/${encodeURIComponent(evidenceId)}`, { method: "POST" }));
}

export async function detachCertificationEvidence(id: string, evidenceId: string): Promise<CertificationRecord> {
  return readCertification(await fetch(`${API_BASE_URL}/certifications/${encodeURIComponent(id)}/evidence/${encodeURIComponent(evidenceId)}`, { method: "DELETE" }));
}


// Profile 1B: GET returns null only for the expected 404 (not configured yet).
// Every other error is surfaced so the UI never silently treats an outage as an empty profile.
export async function getProfile(): Promise<ProfileRecord | null> {
  const response = await fetch(`${API_BASE_URL}/profile`, { cache: "no-store" });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(await getErrorMessage(response));
  return response.json();
}

export async function saveProfile(payload: ProfileWritePayload): Promise<ProfileRecord> {
  const response = await fetch(`${API_BASE_URL}/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await getErrorMessage(response));
  return response.json();
}

// Dossier 2B: bounded requests. A timeout on a write is an UNKNOWN outcome,
// not proof of failure, so the UI must inspect saved records before retrying.
async function dossierJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  return withDossierTimeout(async (signal) => {
    const response = await fetch(url, { ...init, signal });
    if (!response.ok) throw new DossierHttpError(await getErrorMessage(response), response.status);
    return response.json() as Promise<T>;
  });
}

async function dossierDelete(url: string): Promise<void> {
  return withDossierTimeout(async (signal) => {
    const response = await fetch(url, { method: "DELETE", signal });
    if (!response.ok) throw new DossierHttpError(await getErrorMessage(response), response.status);
  });
}

export async function listOpportunities(): Promise<OpportunityRecord[]> {
  return dossierJson<OpportunityRecord[]>(`${API_BASE_URL}/opportunities`, { cache: "no-store" });
}

export async function getOpportunity(id: string): Promise<OpportunityRecord> {
  return dossierJson<OpportunityRecord>(`${API_BASE_URL}/opportunities/${encodeURIComponent(id)}`, { cache: "no-store" });
}

export async function createOpportunity(payload: OpportunityCreatePayload): Promise<OpportunityRecord> {
  return dossierJson<OpportunityRecord>(`${API_BASE_URL}/opportunities`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });
}

export async function updateOpportunity(id: string, payload: OpportunityWritePayload): Promise<OpportunityRecord> {
  return dossierJson<OpportunityRecord>(`${API_BASE_URL}/opportunities/${encodeURIComponent(id)}`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });
}

export async function deleteOpportunity(id: string): Promise<void> {
  return dossierDelete(`${API_BASE_URL}/opportunities/${encodeURIComponent(id)}`);
}

export async function addOpportunityRequirement(id: string, payload: RequirementWritePayload): Promise<RequirementRecord> {
  return dossierJson<RequirementRecord>(`${API_BASE_URL}/opportunities/${encodeURIComponent(id)}/requirements`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });
}

export async function updateOpportunityRequirement(id: string, requirementId: string, payload: RequirementWritePayload): Promise<RequirementRecord> {
  return dossierJson<RequirementRecord>(`${API_BASE_URL}/opportunities/${encodeURIComponent(id)}/requirements/${encodeURIComponent(requirementId)}`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });
}

export async function deleteOpportunityRequirement(id: string, requirementId: string): Promise<void> {
  return dossierDelete(`${API_BASE_URL}/opportunities/${encodeURIComponent(id)}/requirements/${encodeURIComponent(requirementId)}`);
}
