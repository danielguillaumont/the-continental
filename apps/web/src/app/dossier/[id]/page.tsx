"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, ClipboardList, FileLock2, FileText, Pencil, Plus, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { OpportunityForm } from "@/components/dossier/opportunity-form";
import { RequirementEditor } from "@/components/dossier/requirement-editor";
import { AppShell } from "@/components/shell/app-shell";
import { deleteOpportunity, deleteOpportunityRequirement, getOpportunity } from "@/lib/api";
import { dateLabel, opportunityLabel, requirementCount, safeSourceUrl } from "@/lib/dossier-workspace";
import type { OpportunityRecord, RequirementRecord } from "@/types/dossier";

const secondary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border px-3 text-[12px] font-semibold text-text-secondary hover:border-border-strong hover:text-text-primary disabled:opacity-50";

export default function DossierDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const [record, setRecord] = useState<OpportunityRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [addingRequirement, setAddingRequirement] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmRequirement, setConfirmRequirement] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const data = await getOpportunity(id);
    setRecord(data); setError(null);
  }, [id]);

  useEffect(() => {
    let active = true;
    void getOpportunity(id).then((data) => { if (active) { setRecord(data); setError(null); } })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load Dossier."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  async function removeDossier() {
    if (busy) return;
    setBusy(true); setError(null);
    try { await deleteOpportunity(id); router.push("/dossier"); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not delete Dossier."); setBusy(false); }
  }
  async function removeRequirement(requirementId: string) {
    if (busy) return;
    setBusy(true); setError(null);
    try { await deleteOpportunityRequirement(id, requirementId); await refresh(); setConfirmRequirement(null); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not delete requirement."); }
    finally { setBusy(false); }
  }
  async function afterRequirementSaved() {
    try { await refresh(); setAddingRequirement(false); setEditingRequirement(null); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Saved, but could not refresh. Use Refresh."); }
  }
  function renderRequirement(item: RequirementRecord) {
    return <li key={item.id} className="min-w-0 rounded-lg border border-border bg-surface-raised p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1"><span className={`inline-block rounded-md px-2 py-1 text-[11px] font-semibold ${item.kind === "required" ? "bg-gold-surface text-gold" : "bg-info-surface text-info-text"}`}>{item.kind === "required" ? "Required" : "Preferred"}</span><p className="mt-3 whitespace-pre-wrap break-words text-[13px] leading-6 text-text-primary">{item.text}</p>
          {item.sourceExcerpt ? <blockquote className="mt-3 border-l-2 border-gold/50 pl-3 font-mono text-[11px] leading-5 text-text-secondary">Source: “{item.sourceExcerpt}”</blockquote> : <p className="mt-3 text-[11px] text-text-muted">No exact source excerpt supplied</p>}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2"><button type="button" className={secondary} disabled={busy} onClick={() => { setEditingRequirement(item.id); setAddingRequirement(false); setConfirmRequirement(null); }}><Pencil className="size-3.5" />Edit</button><button type="button" className={secondary} disabled={busy} onClick={() => { setConfirmRequirement(item.id); setEditingRequirement(null); }}><Trash2 className="size-3.5" />Remove</button></div>
      </div>
      {confirmRequirement === item.id && <div className="mt-4 rounded-md border border-danger-border bg-danger-surface p-3"><p className="text-[12px] text-danger-text">Remove this requirement? The original posting will remain untouched.</p><div className="mt-3 flex gap-2"><button disabled={busy} type="button" onClick={() => void removeRequirement(item.id)} className="min-h-9 rounded-md bg-danger px-3 text-[12px] font-semibold text-white disabled:opacity-50">Confirm removal</button><button type="button" className={secondary} onClick={() => setConfirmRequirement(null)}>Cancel</button></div></div>}
      {editingRequirement === item.id && <div className="mt-4"><RequirementEditor opportunityId={id} originalSource={record?.sourceText ?? ""} requirement={item} onCancel={() => setEditingRequirement(null)} onSaved={() => void afterRequirementSaved()} /></div>}
    </li>;
  }
  const sourceUrl = record ? safeSourceUrl(record.sourceUrl) : null;

  return <AppShell sectionLabel="Dossier / Opportunity">
    <div className="mx-auto w-full max-w-[1240px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <Link href="/dossier" className="inline-flex min-h-10 items-center gap-2 text-[13px] font-semibold text-text-secondary hover:text-gold"><ArrowLeft className="size-4" />Opportunity registry</Link>
      {error && <p role="alert" className="mt-5 rounded-lg border border-danger-border bg-danger-surface p-4 text-[13px] text-danger-text">{error} <button type="button" className="ml-2 underline" onClick={() => void refresh().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Refresh failed."))}>Retry</button></p>}
      {loading ? <p role="status" className="mt-6 rounded-lg border border-border bg-surface p-7 text-[13px] text-text-secondary">Loading the Dossier…</p> : !record ? <section className="mt-6 rounded-xl border border-border bg-surface p-8"><h1 className="text-xl font-semibold text-text-primary">Dossier unavailable</h1><p className="mt-2 text-[13px] text-text-secondary">It may have been removed, or the API is unavailable.</p><Link className="mt-5 inline-block text-gold hover:underline" href="/dossier">Return to the registry</Link></section> : <>
        <header className="mt-5 flex flex-wrap items-end justify-between gap-5 border-b border-border-subtle pb-7">
          <div className="min-w-0 max-w-3xl"><p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold">Dossier / Opportunity record</p><h1 className="mt-2 break-words font-display text-[39px] leading-tight text-text-primary sm:text-[46px]">{opportunityLabel(record)}</h1><p className="mt-2 text-[16px] font-medium text-gold">{record.company || "Company not specified"}</p><p className="mt-3 text-[13px] leading-6 text-text-secondary">{[record.location, record.employmentType, record.salaryText].filter(Boolean).join(" · ") || "Details not yet recorded"}</p></div>
          <div className="flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={() => void refresh().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Refresh failed."))} className={secondary}><RefreshCw className="size-4" />Refresh</button><button type="button" disabled={busy} onClick={() => setEditing((value) => !value)} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-gold px-4 text-[12px] font-semibold text-text-inverse hover:bg-gold-hover"><Pencil className="size-4" />{editing ? "Close editor" : "Edit details"}</button></div>
        </header>
        <section aria-label="Dossier summary" className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-surface p-5"><ClipboardList className="size-5 text-gold" /><p className="mt-3 text-[12px] text-text-secondary">Requirements</p><p className="mt-1 text-[28px] font-semibold text-text-primary">{requirementCount(record)}</p></div>
          <div className="rounded-lg border border-border bg-surface p-5"><ShieldCheck className="size-5 text-gold" /><p className="mt-3 text-[12px] text-text-secondary">Required / preferred</p><p className="mt-1 text-[26px] font-semibold text-text-primary">{requirementCount(record, "required")} <span className="text-text-muted">/</span> {requirementCount(record, "preferred")}</p></div>
          <div className="rounded-lg border border-border bg-surface p-5"><FileLock2 className="size-5 text-gold" /><p className="mt-3 text-[12px] text-text-secondary">Extraction status</p><p className="mt-2 text-[16px] font-semibold text-text-primary">{record.extractionStatus === "not_run" ? "Not run · Manual" : record.extractionStatus === "completed" ? "Completed" : "Failed"}</p></div>
        </section>
        {editing && <div className="mt-6"><OpportunityForm record={record} onCancel={() => setEditing(false)} onSaved={(saved) => { setRecord(saved); setEditing(false); setError(null); }} /></div>}
        <div className="mt-7 grid items-start gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="min-w-0 space-y-6">
            <section className="rounded-xl border border-border bg-surface p-5 sm:p-6" aria-labelledby="requirements-heading">
              <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">Review / Structured information</p><h2 id="requirements-heading" className="mt-1 text-[21px] font-semibold text-text-primary">Requirements</h2><p className="mt-2 text-[13px] leading-6 text-text-secondary">Classify each requirement explicitly and reference the original words when possible.</p></div><button type="button" onClick={() => { setAddingRequirement(true); setEditingRequirement(null); }} className={secondary}><Plus className="size-4" />Add requirement</button></div>
              {addingRequirement && <div className="mt-5"><RequirementEditor opportunityId={id} originalSource={record.sourceText} onCancel={() => setAddingRequirement(false)} onSaved={() => void afterRequirementSaved()} /></div>}
              {record.requirements.length === 0 ? <div className="mt-5 rounded-lg border border-border bg-surface-raised p-5"><p className="text-[13px] font-semibold text-text-primary">No requirements recorded yet.</p><p className="mt-2 text-[12px] leading-5 text-text-secondary">Add required or preferred qualifications manually from the source. Automated extraction is a future slice, not active here.</p></div> : <ul className="mt-5 space-y-3">{[...record.requirements].sort((a, b) => a.position - b.position).map(renderRequirement)}</ul>}
            </section>
            <section className="rounded-xl border border-border bg-surface p-5 sm:p-6" aria-label="Technologies and provenance"><h2 className="text-[16px] font-semibold text-text-primary">Technologies & provenance</h2><div className="mt-4 flex flex-wrap gap-2">{record.technologies.length ? record.technologies.map((item) => <span key={item} className="rounded-md border border-border-strong bg-surface-raised px-2.5 py-1 text-[12px] text-text-secondary">{item}</span>) : <p className="text-[12px] text-text-muted">No technologies recorded yet.</p>}</div><p className="mt-5 text-[12px] text-text-secondary">Source submitted {dateLabel(record.createdAt)} · Last updated {dateLabel(record.updatedAt)}.</p><p className="mt-2 text-[12px] leading-5 text-text-muted">Extraction provider and model have not been assigned in the manual intake flow. Requirements are owner-entered, not independent verification.</p></section>
          </div>
          <aside className="min-w-0 space-y-6">
            <section className="rounded-xl border border-border bg-surface p-5 sm:p-6" aria-labelledby="source-heading">
              <div className="flex items-start gap-3"><FileText className="mt-0.5 size-5 shrink-0 text-gold" /><div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">Original / Read-only</p><h2 id="source-heading" className="mt-1 text-[21px] font-semibold text-text-primary">Source posting</h2></div></div>
              <p className="mt-3 text-[12px] leading-5 text-text-secondary">The exact text you submitted, preserved separately from any edited details or requirements.</p>
              {sourceUrl && <a className="mt-4 inline-flex min-h-9 items-center gap-2 break-all text-[12px] font-semibold text-gold hover:underline" href={sourceUrl} target="_blank" rel="noopener noreferrer">Open supplied posting URL <ArrowUpRight className="size-4 shrink-0" /></a>}
              <div className="mt-5 max-h-[620px] overflow-y-auto rounded-lg border border-border bg-surface-raised p-4"><pre className="whitespace-pre-wrap break-words font-mono text-[12px] leading-[1.8] text-text-secondary">{record.sourceText}</pre></div>
            </section>
            <section className="rounded-xl border border-danger-border/60 bg-surface p-5" aria-label="Dossier management"><h2 className="text-[14px] font-semibold text-text-primary">Dossier management</h2><p className="mt-2 text-[12px] leading-5 text-text-secondary">Deleting this Dossier removes its saved requirements. It does not delete anything from your career evidence registry.</p>{!confirmDelete ? <button type="button" onClick={() => setConfirmDelete(true)} disabled={busy} className="mt-4 inline-flex min-h-10 items-center gap-2 text-[12px] font-semibold text-danger-text hover:underline"><Trash2 className="size-4" />Delete Dossier</button> : <div className="mt-4 rounded-md border border-danger-border bg-danger-surface p-3"><p className="text-[12px] font-semibold text-danger-text">Permanently delete this Dossier and its requirements?</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={() => void removeDossier()} className="min-h-10 rounded-md bg-danger px-3 text-[12px] font-semibold text-white disabled:opacity-50">{busy ? "Deleting…" : "Confirm delete"}</button><button type="button" onClick={() => setConfirmDelete(false)} disabled={busy} className={secondary}>Cancel</button></div></div>}</section>
          </aside>
        </div>
      </>}
    </div>
  </AppShell>;
}
