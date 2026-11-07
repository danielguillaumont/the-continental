"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, ArrowUpRight, ExternalLink, FilePlus2, FolderKanban, Link2, Pencil, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";

import { ProjectForm } from "@/components/projects/project-form";
import { AppShell } from "@/components/shell/app-shell";
import { attachProjectEvidence, deleteProject, detachProjectEvidence, getProject, listEvidence } from "@/lib/api";
import { createEvidenceForProjectUrl } from "@/lib/project-evidence-flow";
import { projectProofState, projectStatusLabel, proofCountLabel } from "@/lib/project-workspace";
import type { EvidenceRecord } from "@/types/evidence";
import type { ProjectRecord } from "@/types/project";

const button = "inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border bg-surface-raised px-4 text-[13px] font-semibold text-text-secondary hover:border-border-strong hover:bg-surface-hover hover:text-text-primary disabled:opacity-50";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.all([getProject(id), listEvidence()])
      .then(([record, records]) => {
        if (!active) return;
        setProject(record);
        setEvidence(records);
        setLoadError(null);
      })
      .catch((cause: unknown) => {
        if (active) setLoadError(cause instanceof Error ? cause.message : "Could not load the project.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  async function refresh() {
    setBusy(true);
    setActionError(null);
    try {
      const [record, records] = await Promise.all([getProject(id), listEvidence()]);
      setProject(record);
      setEvidence(records);
      setLoadError(null);
    } catch (cause) { setActionError(cause instanceof Error ? cause.message : "Could not refresh project."); }
    finally { setBusy(false); }
  }

  async function attach() {
    if (!selectedEvidence || !project) return;
    setBusy(true); setActionError(null); setNotice(null);
    try {
      const updated = await attachProjectEvidence(project.id, selectedEvidence);
      setProject(updated);
      setSelectedEvidence("");
      setNotice("Evidence attached to this project. The original record remains in your Evidence library.");
    } catch (cause) { setActionError(cause instanceof Error ? cause.message : "Could not attach evidence."); }
    finally { setBusy(false); }
  }

  async function detach(evidenceId: string) {
    if (!project) return;
    setBusy(true); setActionError(null); setNotice(null);
    try {
      const updated = await detachProjectEvidence(project.id, evidenceId);
      setProject(updated);
      setNotice("Evidence detached. The original record is still saved in the Evidence library.");
    } catch (cause) { setActionError(cause instanceof Error ? cause.message : "Could not detach evidence."); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!project) return;
    setBusy(true); setActionError(null);
    try {
      await deleteProject(project.id);
      router.replace("/armory/projects");
    } catch (cause) { setActionError(cause instanceof Error ? cause.message : "Could not delete project."); setBusy(false); }
  }

  const linkedIds = new Set(project?.evidence.map((item) => item.id) ?? []);
  const available = evidence.filter((item) => !linkedIds.has(item.id));

  return (
    <AppShell sectionLabel="Projects">
      <div className="mx-auto w-full max-w-[1160px] px-4 py-7 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <Link href="/armory/projects" className="inline-flex min-h-10 items-center gap-2 text-[13px] font-medium text-text-secondary hover:text-gold"><ArrowLeft className="size-4" aria-hidden="true" />All projects</Link>
        {loading ? <div role="status" className="mt-7 rounded-xl border border-border bg-surface p-7 text-[14px] text-text-secondary">Loading project workspace…</div> : loadError || !project ?
          <div role="alert" className="mt-7 rounded-xl border border-danger-border bg-danger-surface p-6"><p className="flex items-center gap-2 text-[15px] font-semibold text-danger-text"><AlertCircle className="size-5" aria-hidden="true" />Project unavailable</p><p className="mt-2 text-[13px] text-text-secondary">{loadError ?? "This project could not be found."}</p><Link href="/armory/projects" className="mt-4 inline-flex text-[13px] font-semibold text-gold hover:underline">Return to your projects</Link></div>
          : <>
            <header className="mt-4 flex flex-wrap items-start justify-between gap-5 border-b border-border-subtle pb-7">
              <div className="min-w-0 max-w-[720px] flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">Project workspace</p>
                <div className="mt-3 flex flex-wrap items-center gap-3"><h1 className="min-w-0 break-words text-[28px] font-semibold leading-tight text-text-primary sm:text-[34px]">{project.name}</h1><span className="rounded-md border border-border-strong bg-surface-raised px-2.5 py-1 text-[12px] font-semibold text-text-secondary">{projectStatusLabel(project.status)}</span></div>
                <p className="mt-3 whitespace-pre-wrap break-words text-[14px] leading-7 text-text-secondary">{project.summary}</p>
                {project.repositoryUrl && <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-10 items-center gap-2 text-[13px] font-semibold text-gold hover:underline"><ExternalLink className="size-4" aria-hidden="true" />Open repository</a>}
              </div>
              <button className={button} type="button" disabled={busy} onClick={() => { setEditing(true); setNotice(null); }}><Pencil className="size-4" aria-hidden="true" />Edit project</button>
            </header>

            {actionError && <p role="alert" className="mt-5 rounded-lg border border-danger-border bg-danger-surface p-4 text-[13px] text-danger-text">{actionError}</p>}
            {notice && <p role="status" className="mt-5 rounded-lg border border-success-border bg-success-surface p-4 text-[13px] text-success-text">{notice}</p>}
            {editing && <div className="mt-6"><ProjectForm key={project.id} project={project} onCancel={() => setEditing(false)} onSaved={(saved) => { setProject(saved); setEditing(false); setNotice("Project details saved."); setActionError(null); }} /></div>}

            <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_270px]">
              <section aria-labelledby="proof-title" className="min-w-0 rounded-xl border border-border bg-surface">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle p-5 sm:p-6">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-gold">Supporting proof</p>
                    <h2 id="proof-title" className="mt-2 text-[20px] font-semibold text-text-primary">Evidence linked to this project</h2>
                    <p className="mt-1 text-[13px] text-text-secondary">{proofCountLabel(project.evidence.length)} linked. These records remain independent in your Evidence library.</p>
                  </div>
                  <button type="button" className={button} disabled={busy} onClick={() => void refresh()}><RefreshCw className="size-4" aria-hidden="true" />Refresh</button>
                </div>
                <div className="p-5 sm:p-6">
                  {project.evidence.length === 0 ? <div className="rounded-lg border border-dashed border-border-strong bg-surface-raised px-5 py-8 text-center"><ShieldCheck className="mx-auto size-8 text-gold" aria-hidden="true" /><h3 className="mt-3 text-[16px] font-semibold text-text-primary">This project needs supporting evidence.</h3><p className="mx-auto mt-2 max-w-md text-[13px] leading-6 text-text-secondary">Attach a saved record below to support the work described above. Evidence can support multiple projects.</p></div> :
                    <ul className="space-y-3">{project.evidence.map((item) => <li key={item.id} className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-raised p-4"><div className="min-w-0 flex-1"><Link href={`/armory/${item.id}`} className="inline-flex min-h-9 max-w-full items-center gap-2 break-words text-[14px] font-semibold text-text-primary hover:text-gold">{item.title}<ArrowUpRight className="size-4 shrink-0" aria-hidden="true" /></Link><p className="mt-1 text-[12px] text-text-muted">{item.kind} · {item.status}</p></div><button type="button" disabled={busy} onClick={() => void detach(item.id)} aria-label={`Detach ${item.title}`} className={button}>Detach</button></li>)}</ul>}

                  <div className="mt-6 border-t border-border-subtle pt-6">
                    <h3 className="text-[15px] font-semibold text-text-primary">Attach saved evidence</h3>
                    <p className="mt-1 text-[13px] leading-6 text-text-secondary">Choose a record from your Evidence library. Attaching never duplicates the record.</p>
                    <div className="mt-4 flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:items-end">
                      <label className="min-w-0 flex-1 text-[12px] font-semibold text-text-secondary">Available records
                        <select value={selectedEvidence} disabled={busy || available.length === 0} onChange={(event) => setSelectedEvidence(event.target.value)} className="mt-2 min-h-11 w-full min-w-0 rounded-md border border-border bg-surface-raised px-3 text-[14px] text-text-primary focus-visible:border-gold disabled:opacity-50"><option value="">{available.length ? "Select evidence…" : "No unlinked records available"}</option>{available.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
                      </label>
                      <button type="button" disabled={busy || !selectedEvidence} onClick={() => void attach()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-gold px-5 text-[13px] font-semibold text-text-inverse hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-50"><Link2 className="size-4" aria-hidden="true" />Attach evidence</button>
                    </div>
                    <div className="mt-5 rounded-md border border-border-subtle bg-surface-raised p-4"><p className="text-[13px] font-semibold text-text-primary">Need to record something new?</p><p className="mt-1 text-[12px] leading-5 text-text-secondary">Create reusable evidence here. When saved, it will automatically link to this project and bring you back.</p><Link href={createEvidenceForProjectUrl(project.id)} className="mt-3 inline-flex min-h-10 items-center gap-2 text-[13px] font-semibold text-gold hover:underline"><FilePlus2 className="size-4" aria-hidden="true" />Create &amp; attach evidence <ArrowUpRight className="size-4" aria-hidden="true" /></Link></div>
                  </div>
                </div>
              </section>

              <aside className="space-y-4">
                <section className="rounded-xl border border-border bg-surface p-5" aria-label="Project at a glance"><p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-gold">At a glance</p><div className="mt-4 flex items-center gap-3"><FolderKanban className="size-5 text-gold" aria-hidden="true" /><div><p className="text-[22px] font-semibold text-text-primary">{project.evidence.length}</p><p className="text-[12px] text-text-secondary">Linked evidence records</p></div></div><p className={`mt-4 rounded-md px-3 py-2 text-[12px] font-semibold ${projectProofState(project) === "supported" ? "bg-success-surface text-success-text" : "bg-warning-surface text-warning-text"}`}>{projectProofState(project) === "supported" ? "Has supporting evidence" : "Evidence not yet attached"}</p></section>
                <section className="rounded-xl border border-border bg-surface p-5" aria-label="Project next steps"><h2 className="text-[15px] font-semibold text-text-primary">Next steps</h2><ol className="mt-4 space-y-3 text-[13px] leading-5 text-text-secondary"><li><span className="mr-2 font-technical text-gold">01</span>Describe the work <span className="text-success-text">✓</span></li><li><span className="mr-2 font-technical text-gold">02</span>Attach real evidence {project.evidence.length > 0 ? <span className="text-success-text">✓</span> : <span className="text-warning-text">— next</span>}</li><li><span className="mr-2 font-technical text-gold">03</span>Review your proof</li></ol><Link href="/armory" className="mt-5 inline-flex min-h-10 items-center gap-2 text-[13px] font-semibold text-gold hover:underline">Browse Evidence library <ArrowUpRight className="size-4" aria-hidden="true" /></Link></section>
                <section className="rounded-xl border border-danger-border/60 bg-surface p-5" aria-label="Delete project"><h2 className="text-[14px] font-semibold text-text-primary">Project management</h2><p className="mt-2 text-[12px] leading-5 text-text-secondary">Deleting a project removes its links, but never deletes the original evidence records.</p>{!confirmDelete ? <button type="button" disabled={busy} onClick={() => setConfirmDelete(true)} className="mt-4 inline-flex min-h-10 items-center gap-2 text-[12px] font-semibold text-danger-text hover:underline"><Trash2 className="size-4" aria-hidden="true" />Delete project</button> : <div className="mt-4 rounded-md border border-danger-border bg-danger-surface p-3"><p className="text-[13px] font-semibold text-danger-text">Permanently delete this project?</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={() => void remove()} className="min-h-10 rounded-md bg-danger px-3 text-[12px] font-semibold text-white disabled:opacity-50">{busy ? "Deleting…" : "Confirm delete"}</button><button type="button" disabled={busy} onClick={() => setConfirmDelete(false)} className={button}>Cancel</button></div></div>}</section>
              </aside>
            </div>
          </>}
      </div>
    </AppShell>
  );
}
