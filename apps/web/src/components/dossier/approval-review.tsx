"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, ShieldAlert, ShieldCheck } from "lucide-react";
import { applyReviewedDossierExtraction } from "@/lib/api";
import {
  alreadyRecordedMetadata, alreadyRecordedRequirement, alreadyRecordedTechnology,
  createReviewedChoices, planReviewedApproval,
} from "@/lib/dossier-approval";
import { EXTRACTED_FIELDS, verifyExtractionPreview } from "@/lib/dossier-extraction";
import { DossierHttpError, DossierTimeoutError } from "@/lib/dossier-request";
import type { OpportunityRecord } from "@/types/dossier";
import type { ExtractionPreview } from "@/types/dossier-extraction";

const inputClass = "mt-2 min-h-10 w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-[12px] text-text-primary focus:border-gold focus:outline-none disabled:opacity-50";
const selectionClass = "mt-1 size-4 shrink-0 accent-[#b49c61] disabled:opacity-40";

export function ApprovalReview({
  preview, record, onApplied, onBusyChange,
}: {
  preview: ExtractionPreview;
  record: OpportunityRecord;
  onApplied: (record: OpportunityRecord, summary: string) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const [choices, setChoices] = useState(() => createReviewedChoices(preview));
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const plan = planReviewedApproval(preview, record, choices);
  const count = plan.payload ? plan.payload.metadata.length + plan.payload.technologies.length + plan.payload.requirements.length : 0;

  async function apply() {
    if (busy || uncertain || !confirmed || !plan.payload) return;
    setBusy(true);
    onBusyChange(true);
    setError(null);
    try {
      // Recheck immediately before the state-changing request, not only when the model replied.
      const problem = await verifyExtractionPreview(preview, { id: record.id, sourceText: record.sourceText });
      if (problem) throw new Error(problem);
      const result = await applyReviewedDossierExtraction(record.id, plan.payload);
      const total = result.appliedMetadata.length + result.addedTechnologies.length + result.addedRequirements;
      const skipped = result.skippedMetadata.length + result.skippedTechnologies.length + result.skippedRequirements;
      onApplied(result.record, `${total} suggestion${total === 1 ? "" : "s"} saved; ${skipped} skipped. The original posting and existing manual values were preserved.`);
    } catch (cause) {
      if (cause instanceof DossierTimeoutError) {
        setUncertain(true);
        setError("The approval request timed out. The API may already have saved your selection. Do not submit it again. Refresh the Dossier to inspect the saved record first.");
      } else if (cause instanceof DossierHttpError && cause.status === 409) {
        setUncertain(true);
        setError("This preview is stale. Refresh the Dossier before requesting a new preview; nothing from this request was applied.");
      } else {
        setError(cause instanceof Error ? cause.message : "Could not apply this selection. Check the Dossier before retrying.");
      }
    } finally {
      onBusyChange(false);
      setBusy(false);
      setConfirmed(false);
    }
  }

  return <section aria-labelledby="approval-heading" className="mt-5 rounded-lg border border-gold/40 bg-surface-raised p-4 sm:p-5">
    <div className="flex items-start gap-3">
      <ShieldCheck className="mt-1 size-5 shrink-0 text-gold" />
      <div>
        <h4 id="approval-heading" className="text-[17px] font-semibold text-text-primary">Approve individual suggestions</h4>
        <p className="mt-2 text-[12px] leading-5 text-text-secondary">Nothing is selected by default. You can correct values before applying, but every accepted item must keep its verbatim source excerpt. Existing manual metadata is protected and duplicates are skipped.</p>
      </div>
    </div>

    <div className="mt-5 grid gap-5 xl:grid-cols-2">
      <div>
        <h5 className="text-[13px] font-semibold text-text-primary">Opportunity fields</h5>
        <div className="mt-3 space-y-3">{EXTRACTED_FIELDS.map(({ key, label }) => {
          const suggestion = preview.draft[key];
          if (!suggestion.value || !suggestion.sourceExcerpt) return null;
          const occupied = alreadyRecordedMetadata(record, key);
          return <div key={key} className="rounded-md border border-border bg-surface p-3">
            <label className="flex items-start gap-2 text-[12px] font-semibold text-text-primary">
              <input className={selectionClass} type="checkbox" disabled={busy || uncertain || occupied} checked={choices.metadata[key].selected && !occupied} onChange={(event) => { setConfirmed(false); setChoices((old) => ({ ...old, metadata: { ...old.metadata, [key]: { ...old.metadata[key], selected: event.target.checked } } })); }} />
              {label}
            </label>
            {occupied ? <p className="mt-2 text-[11px] text-text-muted">Manual value already saved; this suggestion will not replace it.</p> : <input aria-label={`Correct ${label}`} className={inputClass} disabled={busy || uncertain} maxLength={240} value={choices.metadata[key].value} onChange={(event) => { setConfirmed(false); setChoices((old) => ({ ...old, metadata: { ...old.metadata, [key]: { ...old.metadata[key], value: event.target.value } } })); }} />}
            <p className="mt-2 break-words border-l-2 border-gold/50 pl-2 font-mono text-[11px] text-text-secondary">{suggestion.sourceExcerpt}</p>
          </div>;
        })}</div>
      </div>
      <div>
        <h5 className="text-[13px] font-semibold text-text-primary">Technologies</h5>
        {preview.draft.technologies.length === 0 && <p className="mt-3 text-[12px] text-text-muted">No supported technologies in this preview.</p>}
        <div className="mt-3 space-y-3">{preview.draft.technologies.map((suggestion, i) => {
          const duplicate = alreadyRecordedTechnology(record, choices.technologies[i].value);
          return <div key={`${i}:${suggestion.value}`} className="rounded-md border border-border bg-surface p-3">
            <label className="flex items-start gap-2 text-[12px] font-semibold text-text-primary">
              <input className={selectionClass} type="checkbox" disabled={busy || uncertain || duplicate} checked={choices.technologies[i].selected && !duplicate} onChange={(event) => { setConfirmed(false); setChoices((old) => ({ ...old, technologies: old.technologies.map((item, j) => j === i ? { ...item, selected: event.target.checked } : item) })); }} />
              Technology {i + 1}
            </label>
            <input aria-label={`Correct technology ${i + 1}`} className={inputClass} disabled={busy || uncertain} maxLength={100} value={choices.technologies[i].value} onChange={(event) => { setConfirmed(false); setChoices((old) => ({ ...old, technologies: old.technologies.map((item, j) => j === i ? { ...item, value: event.target.value } : item) })); }} />
            {duplicate && <p className="mt-2 text-[11px] text-text-muted">Already saved; the duplicate is skipped.</p>}
            <p className="mt-2 break-words border-l-2 border-gold/50 pl-2 font-mono text-[11px] text-text-secondary">{suggestion.sourceExcerpt}</p>
          </div>;
        })}</div>
      </div>
    </div>

    <div className="mt-5">
      <h5 className="text-[13px] font-semibold text-text-primary">Qualifications</h5>
      {preview.draft.requirements.length === 0 && <p className="mt-2 text-[12px] text-text-muted">No supported requirements in this preview.</p>}
      <div className="mt-3 grid gap-3 lg:grid-cols-2">{preview.draft.requirements.map((suggestion, i) => {
        const selected = choices.requirements[i];
        const duplicate = alreadyRecordedRequirement(record, selected.text, selected.kind);
        return <div key={`${i}:${suggestion.kind}`} className="rounded-md border border-border bg-surface p-3">
          <label className="flex items-start gap-2 text-[12px] font-semibold text-text-primary">
            <input className={selectionClass} type="checkbox" disabled={busy || uncertain || duplicate} checked={selected.selected && !duplicate} onChange={(event) => { setConfirmed(false); setChoices((old) => ({ ...old, requirements: old.requirements.map((item, j) => j === i ? { ...item, selected: event.target.checked } : item) })); }} />
            Qualification {i + 1}
          </label>
          <textarea aria-label={`Correct qualification ${i + 1}`} className={`${inputClass} min-h-20`} disabled={busy || uncertain} maxLength={2000} value={selected.text} onChange={(event) => { setConfirmed(false); setChoices((old) => ({ ...old, requirements: old.requirements.map((item, j) => j === i ? { ...item, text: event.target.value } : item) })); }} />
          <label className="mt-3 block text-[11px] text-text-secondary">Classification
            <select aria-label={`Qualification ${i + 1} classification`} value={selected.kind} disabled={busy || uncertain} className={inputClass} onChange={(event) => { setConfirmed(false); setChoices((old) => ({ ...old, requirements: old.requirements.map((item, j) => j === i ? { ...item, kind: event.target.value as "required" | "preferred" } : item) })); }}>
              <option value="required">Required</option><option value="preferred">Preferred</option>
            </select>
          </label>
          {duplicate && <p className="mt-2 text-[11px] text-text-muted">Already saved with this classification; skipped.</p>}
          <p className="mt-2 break-words border-l-2 border-gold/50 pl-2 font-mono text-[11px] text-text-secondary">{suggestion.sourceExcerpt}</p>
        </div>;
      })}</div>
    </div>

    <div className="mt-5 rounded-md border border-border bg-surface p-4">
      <div className="flex items-start gap-2 text-[12px] text-text-secondary"><ShieldAlert className="mt-0.5 size-4 shrink-0 text-gold" /><p>Only selected, source-supported additions are submitted. Corrections are your own reviewed interpretation; the system does not independently verify job claims. Newly approved metadata and technology citations are stored with the saved Dossier; earlier uncited entries remain uncited.</p></div>
      {plan.skipped.length > 0 && <p className="mt-3 text-[11px] text-text-muted">Skipped from current selection: {plan.skipped.join("; ")}</p>}
      {plan.error && <p className="mt-3 flex items-center gap-2 text-[12px] text-text-secondary"><AlertCircle className="size-4" />{plan.error}</p>}
      <label className="mt-4 flex items-start gap-3 text-[12px] leading-5 text-text-primary">
        <input type="checkbox" className={selectionClass} disabled={busy || uncertain || !plan.payload} checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
        I checked the selected values against the original posting and explicitly approve saving these changes.
      </label>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" disabled={busy || uncertain || !confirmed || !plan.payload} onClick={() => void apply()} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-gold px-4 text-[12px] font-semibold text-text-inverse hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-40"><CheckCircle2 className="size-4" />{busy ? "Applying…" : `Apply ${count} selected`}</button>
        <span className="text-[11px] text-text-muted">This action writes to PostgreSQL only after confirmation.</span>
      </div>
      {error && <p role="alert" className="mt-3 rounded-md border border-danger-border bg-danger-surface p-3 text-[12px] leading-5 text-danger-text">{error}</p>}
      {uncertain && <p role="status" className="mt-3 text-[12px] text-text-secondary">Further submissions are disabled for this preview. Refresh the Dossier and inspect its saved fields and requirements before proceeding.</p>}
    </div>
  </section>;
}
