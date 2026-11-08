"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, FileSearch, LockKeyhole, ScanText, ShieldCheck, Sparkles } from "lucide-react";
import { requestDossierExtractionPreview } from "@/lib/api";
import { DossierHttpError, DossierTimeoutError } from "@/lib/dossier-request";
import { EXTRACTED_FIELDS, previewEligibility, verifyExtractionPreview } from "@/lib/dossier-extraction";
import type { ExtractionPreview } from "@/types/dossier-extraction";

const secondary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border px-3 text-[12px] font-semibold text-text-secondary hover:border-border-strong hover:text-text-primary disabled:opacity-50";

export function ExtractionReview({ opportunityId, sourceText }: { opportunityId: string; sourceText: string }) {
  const [authorized, setAuthorized] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ExtractionPreview | null>(null);
  const eligibility = previewEligibility(sourceText);

  async function requestPreview() {
    if (busy || !authorized || eligibility) return;
    setBusy(true);
    setPreview(null);
    setError(null);
    // Fresh opt-in is required before every outbound model request.
    setAuthorized(false);
    try {
      const result = await requestDossierExtractionPreview(opportunityId);
      const issue = await verifyExtractionPreview(result, { id: opportunityId, sourceText });
      if (issue) throw new Error(issue);
      setPreview(result);
    } catch (cause) {
      if (cause instanceof DossierHttpError && cause.status === 503) {
        setError("AI extraction is disabled or not configured on this local API. No draft was created. Configure a provider server-side to enable it.");
      } else if (cause instanceof DossierTimeoutError) {
        setError("The preview request timed out. Nothing was applied to this Dossier. The provider may have processed the posting, and repeating the request may incur another API charge.");
      } else {
        setError(cause instanceof Error ? cause.message : "Preview failed; nothing was applied to this Dossier.");
      }
    } finally {
      setBusy(false);
    }
  }

  return <section className="rounded-xl border border-gold/40 bg-surface p-5 sm:p-6" aria-labelledby="dossier-ai-heading">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-2xl">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-gold"><Sparkles className="size-4" /> AI / Extraction preview</p>
        <h2 id="dossier-ai-heading" className="mt-2 font-display text-[30px] leading-tight text-text-primary">Inspect the posting, not a prediction.</h2>
        <p className="mt-2 text-[13px] leading-6 text-text-secondary">Request source-grounded suggestions for job facts, technologies, and qualifications. Every result is a draft requiring review; nothing is added to your saved record.</p>
      </div>
      <span className="rounded-md border border-gold/40 bg-gold-surface px-3 py-1.5 text-[11px] font-semibold text-gold">Preview only · Not saved</span>
    </div>

    <div className="mt-5 grid gap-3 lg:grid-cols-2">
      <div className="rounded-lg border border-border bg-surface-raised p-4">
        <div className="flex items-center gap-2 text-[12px] font-semibold text-text-primary"><LockKeyhole className="size-4 text-gold" /> Your choice to share</div>
        <p className="mt-2 text-[12px] leading-5 text-text-secondary">The complete original job posting will be sent from your local API to a configured external AI provider (OpenAI). Check the posting for personal or confidential details before proceeding. Model usage may incur charges.</p>
      </div>
      <div className="rounded-lg border border-border bg-surface-raised p-4">
        <div className="flex items-center gap-2 text-[12px] font-semibold text-text-primary"><ShieldCheck className="size-4 text-gold" /> Source-first workflow</div>
        <p className="mt-2 text-[12px] leading-5 text-text-secondary">The API validates proposed information against exact excerpts. This step never changes the original posting, manual fields, requirements, or extraction status.</p>
      </div>
    </div>

    <div className="mt-5 rounded-lg border border-border bg-surface-raised p-4">
      <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-6 text-text-primary">
        <input type="checkbox" checked={authorized} onChange={(event) => setAuthorized(event.target.checked)} disabled={busy || !!eligibility} className="mt-1.5 size-4 shrink-0 accent-[#b49c61]" />
        <span>I explicitly authorize sending this Dossier&apos;s original posting to the configured AI provider for one extraction preview. I understand this preview is not saved.</span>
      </label>
      {eligibility && <p role="status" className="mt-3 flex items-start gap-2 text-[12px] text-text-secondary"><AlertCircle className="mt-0.5 size-4 shrink-0" />{eligibility}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" disabled={busy || !authorized || !!eligibility} onClick={() => void requestPreview()} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-gold px-4 text-[12px] font-semibold text-text-inverse hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-40"><ScanText className="size-4" />{busy ? "Requesting preview…" : "Extract with AI"}</button>
        {preview && <button type="button" onClick={() => setPreview(null)} className={secondary}>Clear this preview</button>}
        <span className="text-[11px] text-text-muted">No automatic submission · Opt in each time</span>
      </div>
    </div>

    {busy && <p role="status" className="mt-4 rounded-md border border-border bg-surface-raised p-4 text-[12px] text-text-secondary">Analyzing the original posting. Results will only appear here for review; nothing is being saved.</p>}
    {error && <div role="alert" className="mt-4 rounded-md border border-danger-border bg-danger-surface p-4"><p className="flex items-start gap-2 text-[12px] leading-5 text-danger-text"><AlertCircle className="mt-0.5 size-4 shrink-0" />{error}</p></div>}
    {preview && <div className="mt-6 space-y-5" aria-label="AI extraction preview results">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-4">
        <div><h3 className="flex items-center gap-2 text-[16px] font-semibold text-text-primary"><CheckCircle2 className="size-4 text-gold" />Draft returned for review</h3><p className="mt-1 text-[12px] text-text-secondary">{preview.provider} / {preview.model} · prompt {preview.promptVersion} · source fingerprint verified</p></div>
        <span className="text-[12px] font-semibold text-gold">0 changes applied</span>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <section aria-label="Suggested opportunity fields" className="rounded-lg border border-border bg-surface-raised p-4 sm:p-5">
          <h4 className="text-[14px] font-semibold text-text-primary">Suggested opportunity details</h4>
          <div className="mt-3 space-y-3">{EXTRACTED_FIELDS.map(({ key, label }) => {
            const item = preview.draft[key];
            return <div key={key} className="border-b border-border-subtle pb-3 last:border-0 last:pb-0"><p className="text-[11px] font-semibold text-text-muted">{label}</p><p className="mt-1 break-words text-[13px] font-semibold text-text-primary">{item.value ?? "Not stated in posting"}</p>{item.sourceExcerpt && <blockquote className="mt-2 break-words border-l-2 border-gold/60 pl-3 font-mono text-[11px] leading-5 text-text-secondary">&ldquo;{item.sourceExcerpt}&rdquo;</blockquote>}</div>;
          })}</div>
        </section>
        <section aria-label="Suggested technologies" className="rounded-lg border border-border bg-surface-raised p-4 sm:p-5">
          <h4 className="text-[14px] font-semibold text-text-primary">Suggested technologies <span className="font-normal text-text-muted">({preview.draft.technologies.length})</span></h4>
          {preview.draft.technologies.length === 0 ? <p className="mt-3 text-[12px] text-text-secondary">None explicitly supported by the posting.</p> : <ul className="mt-3 space-y-3">{preview.draft.technologies.map((item, index) => <li key={`${item.value}-${index}`} className="rounded-md border border-border bg-surface p-3"><span className="text-[12px] font-semibold text-gold">{item.value}</span><p className="mt-2 break-words border-l-2 border-gold/50 pl-3 font-mono text-[11px] leading-5 text-text-secondary">&ldquo;{item.sourceExcerpt}&rdquo;</p></li>)}</ul>}
        </section>
      </div>
      <section aria-label="Suggested requirements" className="rounded-lg border border-border bg-surface-raised p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="text-[14px] font-semibold text-text-primary">Suggested requirements</h4><span className="text-[12px] text-text-muted">{preview.draft.requirements.length} proposed</span></div>
        {preview.draft.requirements.length === 0 ? <p className="mt-3 text-[12px] text-text-secondary">No explicit required or preferred qualifications were extracted.</p> : <ul className="mt-4 grid gap-3 lg:grid-cols-2">{preview.draft.requirements.map((item, index) => <li key={`${item.kind}-${index}`} className="rounded-md border border-border bg-surface p-4"><span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${item.kind === "required" ? "bg-gold-surface text-gold" : "bg-info-surface text-info-text"}`}>{item.kind === "required" ? "Required" : "Preferred"}</span><p className="mt-3 whitespace-pre-wrap break-words text-[13px] text-text-primary">{item.text}</p><blockquote className="mt-3 break-words border-l-2 border-gold/50 pl-3 font-mono text-[11px] leading-5 text-text-secondary">&ldquo;{item.sourceExcerpt}&rdquo;</blockquote></li>)}</ul>}
      </section>
      <div className="flex items-start gap-3 rounded-lg border border-gold/40 bg-gold-surface p-4"><FileSearch className="mt-0.5 size-5 shrink-0 text-gold" /><p className="text-[12px] leading-5 text-text-primary"><strong>Review only:</strong> These suggestions have not changed the Dossier. Approval, correction and selective saving are reserved for Slice 2D. Use the existing manual editors if you want to update your saved record now.</p></div>
    </div>}
  </section>;
}
