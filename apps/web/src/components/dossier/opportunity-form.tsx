"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, FileText, Save, ShieldCheck } from "lucide-react";
import { createOpportunity, listOpportunities, updateOpportunity } from "@/lib/api";
import { DossierHttpError, DossierTimeoutError } from "@/lib/dossier-request";
import { dossierUrl, findExactSavedOpportunity, parseTechnologies, validateOpportunity } from "@/lib/dossier-workspace";
import type { OpportunityRecord, OpportunityWritePayload } from "@/types/dossier";

const input = "mt-2 min-h-11 w-full rounded-md border border-border bg-surface-raised px-3 py-2.5 text-[14px] text-text-primary outline-none placeholder:text-text-muted focus-visible:border-gold disabled:opacity-50";
const label = "block min-w-0 text-[12px] font-semibold text-text-secondary";

export function OpportunityForm({ record, onSaved, onCancel }: {
  record?: OpportunityRecord;
  onSaved: (saved: OpportunityRecord) => void;
  onCancel: () => void;
}) {
  const [sourceText, setSourceText] = useState("");
  const [title, setTitle] = useState(record?.title ?? "");
  const [company, setCompany] = useState(record?.company ?? "");
  const [location, setLocation] = useState(record?.location ?? "");
  const [employmentType, setEmploymentType] = useState(record?.employmentType ?? "");
  const [salaryText, setSalaryText] = useState(record?.salaryText ?? "");
  const [sourceUrl, setSourceUrl] = useState(record?.sourceUrl ?? "");
  const [technologies, setTechnologies] = useState(record?.technologies.join(", ") ?? "");
  const [saving, setSaving] = useState(false);
  const [saveUncertain, setSaveUncertain] = useState(false);
  const [savedRecord, setSavedRecord] = useState<OpportunityRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || saveUncertain || savedRecord) return;
    const metadata: OpportunityWritePayload = {
      title: title.trim() || null, company: company.trim() || null,
      location: location.trim() || null, employmentType: employmentType.trim() || null,
      salaryText: salaryText.trim() || null, sourceUrl: sourceUrl.trim() || null,
      technologies: parseTechnologies(technologies),
    };
    const createPayload = { ...metadata, sourceText };
    const issue = validateOpportunity(record ? metadata : createPayload);
    if (issue) { setError(issue); return; }
    setError(null); setSaving(true);
    try {
      const saved = record ? await updateOpportunity(record.id, metadata) : await createOpportunity(createPayload);
      setSavedRecord(saved);
      onSaved(saved);
    } catch (cause) {
      // A completed 4xx response is a definite rejection, not an uncertain write.
      if (cause instanceof DossierHttpError && cause.status >= 400 && cause.status < 500) {
        setError(cause.message);
        return;
      }
      // A write may commit even if its response is lost. Never retry automatically.
      // For a new posting, reconcile against the registry using the EXACT original source.
      if (!record) {
        try {
          const existing = findExactSavedOpportunity(await listOpportunities(), createPayload);
          if (existing) {
            setSavedRecord(existing);
            onSaved(existing);
            return;
          }
        } catch {
          // Registry is also unreachable; leave the outcome explicitly uncertain.
        }
      }
      if (cause instanceof DossierTimeoutError || !record) {
        setSaveUncertain(true);
        setError("Save status is uncertain. The record may already exist. Check the Dossier registry before trying again; do not submit a duplicate.");
      } else {
        setError(cause instanceof Error ? cause.message : "Could not save opportunity. Refresh the record before retrying.");
      }
    } finally { setSaving(false); }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-6">
      {!record && <section aria-labelledby="posting-heading" className="rounded-xl border border-gold/40 bg-surface p-5 sm:p-7">
        <div className="flex items-start gap-3"><FileText className="mt-1 size-5 shrink-0 text-gold" aria-hidden="true" /><div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">01 / Source document</p>
          <h2 id="posting-heading" className="mt-1 text-[20px] font-semibold text-text-primary">The original posting</h2>
          <p className="mt-1 text-[13px] leading-6 text-text-secondary">Paste the complete job description. It will be preserved exactly as entered and cannot be silently replaced by later edits.</p>
        </div></div>
        <label className={`${label} mt-5`}>Job description <span className="text-gold">*</span>
          <textarea className={`${input} min-h-[250px] resize-y font-mono text-[12px] leading-6`} value={sourceText} onChange={(event) => setSourceText(event.target.value)} minLength={20} maxLength={100000} required placeholder="Paste the position, company, responsibilities and requirements here…" />
        </label>
        <p className="mt-2 text-right text-[11px] tabular-nums text-text-muted">{sourceText.length.toLocaleString("en-CA")} / 100,000 characters</p>
      </section>}
      <section aria-labelledby="details-heading" className="rounded-xl border border-border bg-surface p-5 sm:p-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">{record ? "Update / Manual fields" : "02 / Manual fields"}</p>
        <h2 id="details-heading" className="mt-1 text-[20px] font-semibold text-text-primary">Opportunity details</h2>
        <p className="mt-2 text-[13px] leading-6 text-text-secondary">Enter what the posting actually says. Blank fields remain unknown until you supply them; AI extraction arrives in a later slice.</p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className={label}>Position title
            <input className={input} maxLength={200} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Cloud Security Engineer" />
          </label>
          <label className={label}>Company
            <input className={input} maxLength={160} value={company} onChange={(event) => setCompany(event.target.value)} placeholder="e.g. Acme Technologies" />
          </label>
          <label className={label}>Location
            <input className={input} maxLength={200} value={location} onChange={(event) => setLocation(event.target.value)} placeholder="e.g. Vancouver, BC · Hybrid" />
          </label>
          <label className={label}>Employment type
            <input className={input} maxLength={60} value={employmentType} onChange={(event) => setEmploymentType(event.target.value)} placeholder="e.g. Full-time" />
          </label>
          <label className={label}>Compensation (only if provided)
            <input className={input} maxLength={240} value={salaryText} onChange={(event) => setSalaryText(event.target.value)} placeholder="e.g. CAD $110,000–$135,000" />
          </label>
          <label className={label}>Original posting URL (optional)
            <input className={input} type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://example.com/careers/position" />
          </label>
        </div>
        <label className={`${label} mt-5`}>Technologies (comma-separated)
          <textarea className={`${input} min-h-20`} value={technologies} onChange={(event) => setTechnologies(event.target.value)} placeholder="Python, AWS, Terraform, Kubernetes" rows={2} />
        </label>
        <p className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-surface-raised p-3 text-[12px] leading-5 text-text-secondary"><ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-gold" />Manual record only. Nothing is inferred, matched to your experience, or verified against an external source.</p>
      </section>
      {savedRecord && <div role="status" className="rounded-lg border border-gold/40 bg-gold-surface p-4 text-[13px] text-text-primary">Saved successfully. If navigation does not finish, <Link className="font-semibold text-gold underline" href={dossierUrl(savedRecord.id)}>open the saved Dossier directly</Link>.</div>}
      {error && <div role="alert" className="rounded-lg border border-danger-border bg-danger-surface p-4 text-[13px] text-danger-text"><p>{error}</p>{saveUncertain && <div className="mt-3 flex flex-wrap items-center gap-3"><Link href="/dossier" className="font-semibold underline">Check saved opportunities</Link><button type="button" className="font-semibold underline" onClick={() => { setSaveUncertain(false); setError(null); }}>I checked: no copy exists</button></div>}</div>}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={saving || saveUncertain || !!savedRecord} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-gold px-5 text-[13px] font-semibold text-text-inverse hover:bg-gold-hover disabled:opacity-50">{record ? <Save className="size-4" /> : <ArrowRight className="size-4" />} {saving ? "Saving…" : savedRecord ? "Saved" : saveUncertain ? "Check registry first" : record ? "Save details" : "Save and open Dossier"}</button>
        <button type="button" disabled={saving} onClick={onCancel} className="min-h-11 rounded-md border border-border px-4 text-[13px] font-semibold text-text-secondary hover:border-border-strong hover:text-text-primary disabled:opacity-50">Cancel</button>
      </div>
    </form>
  );
}
