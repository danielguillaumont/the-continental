"use client";

import { useState, type FormEvent } from "react";
import { DossierHttpError } from "@/lib/dossier-request";
import { addOpportunityRequirement, updateOpportunityRequirement } from "@/lib/api";
import { validateRequirement } from "@/lib/dossier-workspace";
import type { RequirementKind, RequirementRecord, RequirementWritePayload } from "@/types/dossier";

const field = "mt-2 min-h-11 w-full rounded-md border border-border bg-surface-raised px-3 py-2.5 text-[13px] text-text-primary outline-none placeholder:text-text-muted focus-visible:border-gold disabled:opacity-50";

export function RequirementEditor({ opportunityId, originalSource, requirement, onSaved, onCancel }: {
  opportunityId: string;
  originalSource: string;
  requirement?: RequirementRecord;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(requirement?.text ?? "");
  const [kind, setKind] = useState<RequirementKind>(requirement?.kind ?? "required");
  const [excerpt, setExcerpt] = useState(requirement?.sourceExcerpt ?? "");
  const [busy, setBusy] = useState(false);
  const [outcomeUnknown, setOutcomeUnknown] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || outcomeUnknown) return;
    const payload: RequirementWritePayload = { kind, text: text.trim(), sourceExcerpt: excerpt || null };
    const issue = validateRequirement(payload, originalSource);
    if (issue) { setError(issue); return; }
    setBusy(true); setError(null);
    try {
      if (requirement) await updateOpportunityRequirement(opportunityId, requirement.id, payload);
      else await addOpportunityRequirement(opportunityId, payload);
      onSaved();
    } catch (cause) {
      if (cause instanceof DossierHttpError && cause.status >= 400 && cause.status < 500) {
        setError(cause.message);
      } else {
        setOutcomeUnknown(true);
        setError("The requirement may have been saved. Refresh the Dossier and inspect the requirement list before adding or editing it again.");
      }
    } finally { setBusy(false); }
  }

  return <form onSubmit={(event) => void submit(event)} className="rounded-lg border border-gold/40 bg-surface-raised p-4 sm:p-5">
    <h3 className="text-[14px] font-semibold text-text-primary">{requirement ? "Edit requirement" : "Record a requirement"}</h3>
    <p className="mt-2 text-[12px] leading-5 text-text-secondary">Classify the requirement manually. If providing a source excerpt, copy it verbatim from the original posting.</p>
    <div className="mt-4 grid gap-4 sm:grid-cols-[180px_1fr]">
      <label className="text-[12px] font-semibold text-text-secondary">Type
        <select className={field} value={kind} onChange={(event) => setKind(event.target.value as RequirementKind)} disabled={busy}>
          <option value="required">Required</option><option value="preferred">Preferred</option>
        </select>
      </label>
      <label className="text-[12px] font-semibold text-text-secondary">Requirement <span className="text-gold">*</span>
        <textarea className={`${field} min-h-[94px]`} value={text} minLength={2} maxLength={2000} onChange={(event) => setText(event.target.value)} required disabled={busy} placeholder="e.g. Experience deploying services with Kubernetes" />
      </label>
    </div>
    <label className="mt-4 block text-[12px] font-semibold text-text-secondary">Exact source excerpt (optional)
      <textarea className={`${field} min-h-20 font-mono text-[12px]`} maxLength={2000} value={excerpt} onChange={(event) => setExcerpt(event.target.value)} disabled={busy} placeholder="Copy a phrase verbatim from the saved posting" />
    </label>
    {error && <p role="alert" className="mt-4 rounded-md border border-danger-border bg-danger-surface p-3 text-[12px] text-danger-text">{error}</p>}
    <div className="mt-4 flex flex-wrap gap-3">
      <button type="submit" disabled={busy || outcomeUnknown} className="min-h-10 rounded-md bg-gold px-4 text-[12px] font-semibold text-text-inverse hover:bg-gold-hover disabled:opacity-50">{busy ? "Saving…" : outcomeUnknown ? "Refresh Dossier first" : requirement ? "Save requirement" : "Add requirement"}</button>
      <button type="button" disabled={busy} onClick={onCancel} className="min-h-10 rounded-md border border-border px-4 text-[12px] font-semibold text-text-secondary hover:bg-surface-hover disabled:opacity-50">Cancel</button>
    </div>
  </form>;
}
