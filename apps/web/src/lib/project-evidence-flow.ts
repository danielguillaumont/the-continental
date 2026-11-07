// Project context is used only for internal navigation; never accept a redirect URL.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isProjectContextId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function createEvidenceForProjectUrl(projectId: string): string {
  return `/armory/new?project=${encodeURIComponent(projectId)}`;
}

export type CreateAndLinkOutcome =
  | { kind: "linked"; evidenceId: string }
  | { kind: "saved-unlinked"; evidenceId: string; reason: string };

// A partial failure is NOT a failed save. Preserve the new record's ID so
// retrying can attach it without creating another evidence record.
export async function createAndLinkEvidence<TPayload>(
  projectId: string,
  payload: TPayload,
  create: (payload: TPayload) => Promise<{ id: string }>,
  attach: (projectId: string, evidenceId: string) => Promise<unknown>,
): Promise<CreateAndLinkOutcome> {
  const saved = await create(payload);
  try {
    await attach(projectId, saved.id);
    return { kind: "linked", evidenceId: saved.id };
  } catch (error) {
    return {
      kind: "saved-unlinked",
      evidenceId: saved.id,
      reason: error instanceof Error ? error.message : "Project linking failed.",
    };
  }
}

export async function retryProjectLink(
  projectId: string,
  evidenceId: string,
  attach: (projectId: string, evidenceId: string) => Promise<unknown>,
): Promise<void> {
  await attach(projectId, evidenceId);
}
