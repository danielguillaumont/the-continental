"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AlertCircle, ArrowLeft, ExternalLink, FolderKanban, Link2, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { attachProjectEvidence, createProject, deleteProject, detachProjectEvidence, listEvidence, listProjects, updateProject } from "@/lib/api";
import type { EvidenceRecord } from "@/types/evidence";
import type { ProjectRecord, ProjectStatus, ProjectWritePayload } from "@/types/project";

type Draft = { name: string; summary: string; repositoryUrl: string; status: ProjectStatus };
const newDraft: Draft = { name: "", summary: "", repositoryUrl: "", status: "active" };
const field = "mt-2 w-full rounded-md border border-border bg-surface-raised px-3 py-2.5 text-[13px] text-text-primary outline-none placeholder:text-text-disabled focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/30";
const label = "block text-[11px] font-semibold uppercase tracking-[0.1em] text-text-muted";
const smallButton = "inline-flex min-h-9 items-center gap-2 rounded-md border border-border bg-surface-raised px-3 text-[12px] font-semibold text-text-secondary hover:bg-surface-hover hover:text-text-primary focus-visible:outline-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-50";

function describe(error: unknown) { return error instanceof Error ? error.message : "Unexpected request error."; }
function isHttpUrl(value: string) { try { const u = new URL(value); return u.protocol === "https:" || u.protocol === "http:"; } catch { return false; } }

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>({ ...newDraft });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selection, setSelection] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, e] = await Promise.all([listProjects(), listEvidence()]);
      setProjects(p); setEvidence(e); setError(null);
    } catch (cause) { setError(describe(cause)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    let active = true;
    void Promise.all([listProjects(), listEvidence()])
      .then(([loadedProjects, loadedEvidence]) => {
        if (!active) return;
        setProjects(loadedProjects);
        setEvidence(loadedEvidence);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (active) setError(describe(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  function newProject() { setEditingId(null); setDraft({ ...newDraft }); setFormOpen(true); setError(null); }
  function editProject(project: ProjectRecord) {
    setEditingId(project.id);
    setDraft({ name: project.name, summary: project.summary, repositoryUrl: project.repositoryUrl ?? "", status: project.status });
    setFormOpen(true); setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: ProjectWritePayload = { name: draft.name.trim(), summary: draft.summary.trim(), repositoryUrl: draft.repositoryUrl.trim() || null, status: draft.status };
    if (payload.name.length < 3 || payload.summary.length < 10) { setError("Enter a name of at least 3 characters and a summary of at least 10."); return; }
    if (payload.repositoryUrl && !isHttpUrl(payload.repositoryUrl)) { setError("Repository URL must be an http:// or https:// address."); return; }
    setSaving(true); setError(null); setNotice(null);
    try {
      if (editingId) await updateProject(editingId, payload);
      else await createProject(payload);
      setNotice(editingId ? "Project updated." : "Project created. Now link supporting evidence.");
      setEditingId(null); setFormOpen(false);
      await load();
    } catch (cause) { setError(describe(cause)); }
    finally { setSaving(false); }
  }
  async function remove(project: ProjectRecord) {
    setBusyId(project.id); setError(null); setNotice(null);
    try {
      await deleteProject(project.id);
      setDeletingId(null); setNotice(`Deleted ${project.name}; all evidence records were preserved.`);
      await load();
    } catch (cause) { setError(describe(cause)); }
    finally { setBusyId(null); }
  }
  async function setLink(projectId: string, evidenceId: string, detach: boolean) {
    if (!evidenceId) return;
    setBusyId(projectId); setError(null); setNotice(null);
    try {
      if (detach) await detachProjectEvidence(projectId, evidenceId);
      else await attachProjectEvidence(projectId, evidenceId);
      setSelection((old) => ({ ...old, [projectId]: "" }));
      setNotice(detach ? "Link removed; evidence stays in the Armory." : "Evidence linked to the project.");
      await load();
    } catch (cause) { setError(describe(cause)); }
    finally { setBusyId(null); }
  }

  return (
    <AppShell sectionLabel="Armory · Projects">
      <div className="mx-auto w-full max-w-[1120px] px-4 py-7 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <Link href="/armory" className="inline-flex items-center gap-2 text-[12px] text-text-secondary hover:text-text-primary"><ArrowLeft aria-hidden="true" className="size-4" />Back to Armory</Link>
        <header className="mt-6 flex flex-wrap items-end justify-between gap-4 border-b border-border-subtle pb-6">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">Armory / Project registry</p>
            <h1 className="mt-2 text-[24px] font-semibold tracking-tight text-text-primary">Projects with proof.</h1>
            <p className="mt-2 text-[13px] leading-6 text-text-secondary">Build a durable project record, then link the evidence that supports it. A project can have many artifacts; evidence stays independent.</p>
          </div>
          <button type="button" onClick={newProject} className="inline-flex h-10 items-center gap-2 rounded-md bg-gold px-4 text-[13px] font-semibold text-text-inverse hover:bg-gold-hover focus-visible:outline-2 focus-visible:outline-gold"><Plus className="size-4" aria-hidden="true"/>New project</button>
        </header>

        {error && <div role="alert" className="mt-5 flex items-start gap-2 rounded-lg border border-danger-border bg-danger-surface p-4 text-[13px] text-danger-text"><AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{error}</div>}
        {notice && <div role="status" className="mt-5 rounded-lg border border-success-border bg-success-surface p-4 text-[13px] text-success-text">{notice}</div>}

        {formOpen && <section aria-label={editingId ? "Edit project" : "Create project"} className="mt-6 rounded-lg border border-gold/50 bg-surface p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3"><h2 className="text-[16px] font-semibold text-text-primary">{editingId ? "Edit project" : "Create project"}</h2><button type="button" aria-label="Close project form" disabled={saving} onClick={() => setFormOpen(false)} className={smallButton}><X aria-hidden="true" className="size-4" /></button></div>
          <form onSubmit={(event) => void save(event)} className="mt-5 grid gap-4">
            <label className={label}>Project name<input className={field} required minLength={3} maxLength={160} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Security configuration analyzer" /></label>
            <label className={label}>What did you build?<textarea className={field} required minLength={10} maxLength={2000} rows={3} value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} placeholder="Describe the actual engineering work, without unsupported claims." /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={label}>Repository URL (optional)<input className={field} type="url" value={draft.repositoryUrl} onChange={(event) => setDraft({ ...draft, repositoryUrl: event.target.value })} placeholder="https://github.com/..." /></label>
              <label className={label}>Project status<select className={field} value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as ProjectStatus })}><option value="active">Active</option><option value="completed">Completed</option><option value="paused">Paused</option></select></label>
            </div>
            <div className="flex flex-wrap gap-3 pt-1"><button disabled={saving} type="submit" className="min-h-10 rounded-md bg-gold px-4 text-[13px] font-semibold text-text-inverse hover:bg-gold-hover disabled:opacity-50">{saving ? "Saving…" : editingId ? "Save changes" : "Create project"}</button><button type="button" disabled={saving} onClick={() => setFormOpen(false)} className={smallButton}>Cancel</button></div>
          </form>
        </section>}

        <section aria-labelledby="registry-title" className="mt-7">
          <div className="mb-4 flex items-center justify-between gap-3"><div><h2 id="registry-title" className="text-[15px] font-semibold text-text-primary">Project registry</h2><p className="mt-1 text-[12px] text-text-muted">{loading ? "Loading…" : `${projects.length} projects · ${evidence.length} evidence records available`}</p></div><button type="button" disabled={loading} onClick={() => void load()} className={smallButton}><RefreshCw aria-hidden="true" className="size-4"/>Refresh</button></div>
          {loading ? <div role="status" className="rounded-lg border border-border bg-surface p-6 text-[13px] text-text-muted">Loading projects…</div> : error && projects.length === 0 ? <div className="rounded-lg border border-danger-border bg-danger-surface p-6 text-[13px] text-danger-text">Cannot load the registry. Check the API and retry.</div> : projects.length === 0 ? <div className="rounded-lg border border-border bg-surface p-8 text-center"><FolderKanban aria-hidden="true" className="mx-auto size-7 text-gold"/><h3 className="mt-3 text-[15px] font-semibold text-text-primary">No projects yet</h3><p className="mx-auto mt-2 max-w-md text-[13px] leading-6 text-text-secondary">Create your first project, then link supporting evidence from the Armory.</p><button onClick={newProject} type="button" className="mt-4 text-[13px] font-semibold text-gold hover:text-gold-hover">Create your first project</button></div> :
            <div className="grid gap-4">{projects.map((project) => {
              const linked = new Set(project.evidence.map((item) => item.id));
              const available = evidence.filter((item) => !linked.has(item.id));
              const busy = busyId === project.id;
              return <article key={project.id} className="rounded-lg border border-border bg-surface p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="break-words text-[16px] font-semibold text-text-primary">{project.name}</h3><span className="rounded border border-border-strong bg-surface-raised px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-secondary">{project.status}</span></div><p className="mt-2 whitespace-pre-wrap break-words text-[13px] leading-6 text-text-secondary">{project.summary}</p>{project.repositoryUrl && <a href={project.repositoryUrl} rel="noopener noreferrer" target="_blank" className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-gold hover:text-gold-hover"><ExternalLink aria-hidden="true" className="size-3.5"/>Repository</a>}</div><div className="flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={() => editProject(project)} className={smallButton}><Pencil aria-hidden="true" className="size-3.5"/>Edit</button><button type="button" disabled={busy} onClick={() => setDeletingId(project.id)} className={smallButton}><Trash2 aria-hidden="true" className="size-3.5"/>Delete</button></div></div>
                {deletingId === project.id && <div className="mt-4 rounded-md border border-danger-border bg-danger-surface p-4 text-[12px] text-text-secondary"><p className="font-semibold text-danger-text">Delete {project.name}?</p><p className="mt-1">This removes only the project and its links. Evidence remains saved.</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={() => void remove(project)} className="rounded-md bg-danger px-3 py-2 font-semibold text-white disabled:opacity-50">{busy ? "Deleting…" : "Confirm delete"}</button><button type="button" disabled={busy} onClick={() => setDeletingId(null)} className={smallButton}>Cancel</button></div></div>}
                <div className="mt-5 border-t border-border-subtle pt-4"><div className="flex items-center justify-between gap-2"><h4 className="text-[12px] font-semibold text-text-primary">Supporting evidence</h4><span className="text-[11px] text-text-muted">{project.evidence.length} linked</span></div>
                  {project.evidence.length === 0 ? <p className="mt-3 text-[12px] text-text-muted">No evidence yet. A project name is not proof on its own.</p> : <ul className="mt-3 space-y-2">{project.evidence.map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border-subtle bg-surface-raised px-3 py-2"><Link href={`/armory/${item.id}`} className="min-w-0 break-words text-[12px] font-medium text-text-primary hover:text-gold">{item.title}<span className="ml-1 text-[11px] font-normal text-text-muted">· {item.kind} · {item.status}</span></Link><button type="button" disabled={busy} onClick={() => void setLink(project.id, item.id, true)} aria-label={`Detach ${item.title} from ${project.name}`} className="text-[11px] font-semibold text-text-muted hover:text-danger-text disabled:opacity-50">Detach</button></li>)}</ul>}
                  <div className="mt-4 flex flex-wrap items-end gap-3"><label className="min-w-[180px] flex-1 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Attach existing evidence<select className={field} disabled={busy || !available.length} value={selection[project.id] ?? ""} onChange={(event) => setSelection((previous) => ({ ...previous, [project.id]: event.target.value }))}><option value="">{available.length ? "Choose evidence…" : "No unlinked evidence"}</option>{available.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><button type="button" disabled={busy || !selection[project.id]} onClick={() => void setLink(project.id, selection[project.id], false)} className={smallButton}><Link2 aria-hidden="true" className="size-3.5"/>Link</button><Link href="/armory/new" className="text-[12px] font-semibold text-gold hover:text-gold-hover">Create evidence</Link></div>
                </div>
              </article>;
            })}</div>}
        </section>
      </div>
    </AppShell>
  );
}
