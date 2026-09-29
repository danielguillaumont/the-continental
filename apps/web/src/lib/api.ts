import type {
  EvidenceKind,
  EvidenceRecord,
  EvidenceStatus,
} from "@/types/evidence";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export type EvidenceCreatePayload = {
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
  payload: EvidenceCreatePayload,
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