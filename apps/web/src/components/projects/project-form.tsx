"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle, X } from "lucide-react";

import { createProject, updateProject } from "@/lib/api";
import type { ProjectRecord, ProjectStatus, ProjectWritePayload } from "@/types/project";

type Draft = { name: string; summary: string; repositoryUrl: string; status: ProjectStatus };

const input = "mt-2 w-full min-w-0 rounded-md border border-border bg-surface-raised px-3 py-3 text-[14px] text-text-primary outline-none placeholder:text-text-muted focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/30";
const label = "block min-w-0 text-[12px] font-semibold text-text-secondary";

function validRepositoryUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function ProjectForm({
  project,
  onSaved,
  onCancel,
}: {
  project?: ProjectRecord;
  onSaved: (saved: ProjectRecord) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Draft>({
    name: project?.name ?? "",
    summary: project?.summary ?? "",
    repositoryUrl: project?.repositoryUrl ?? "",
    status: project?.status ?? "active",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: ProjectWritePayload = {
      name: draft.name.trim(),
      summary: draft.summary.trim(),
      repositoryUrl: draft.repositoryUrl.trim() || null,
      status: draft.status,
    };
    if (payload.name.length < 3 || payload.summary.length < 10) {
      setError("Add a project name (3+ characters) and a description (10+ characters).");
      return;
    }
    if (payload.repositoryUrl && !validRepositoryUrl(payload.repositoryUrl)) {
      setError("Enter a valid http:// or https:// repository link.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const saved = project
        ? await updateProject(project.id, payload)
        : await createProject(payload);
      onSaved(saved);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save this project.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-labelledby="project-form-title" className="rounded-xl border border-gold/50 bg-surface p-5 shadow-lg shadow-black/10 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">Project details</p>
          <h2 id="project-form-title" className="mt-2 text-xl font-semibold text-text-primary">{project ? "Edit project" : "Create a project"}</h2>
          <p className="mt-2 max-w-xl text-[13px] leading-6 text-text-secondary">Start with the work itself. Supporting evidence can be linked from the project workspace after saving.</p>
        </div>
        <button type="button" disabled={saving} onClick={onCancel} aria-label="Close project form" className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border text-text-secondary hover:bg-surface-hover disabled:opacity-50"><X className="size-4" aria-hidden="true" /></button>
      </div>
      {error && <p role="alert" className="mt-5 flex items-start gap-2 rounded-md border border-danger-border bg-danger-surface p-3 text-[13px] text-danger-text"><AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{error}</p>}
      <form className="mt-6 grid gap-5" onSubmit={(event) => void submit(event)}>
        <label className={label}>Project name <span className="text-gold">*</span>
          <input className={input} required minLength={3} maxLength={160} autoFocus placeholder="e.g. Windows configuration analyzer" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
        </label>
        <label className={label}>What did you build? <span className="text-gold">*</span>
          <textarea className={input} required minLength={10} maxLength={2000} rows={4} placeholder="Describe your role, what you built, and the problem it solves." value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} />
          <span className="mt-1 block text-[12px] font-normal text-text-muted">Describe real work. You can connect proof after the project is saved.</span>
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className={label}>Repository URL <span className="font-normal text-text-muted">(optional)</span>
            <input className={input} type="url" placeholder="https://github.com/..." value={draft.repositoryUrl} onChange={(event) => setDraft({ ...draft, repositoryUrl: event.target.value })} />
          </label>
          <label className={label}>Current status
            <select className={input} value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as ProjectStatus })}>
              <option value="active">In progress</option>
              <option value="completed">Completed</option>
              <option value="paused">On hold</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-border-subtle pt-5">
          <button type="submit" disabled={saving} className="min-h-11 rounded-md bg-gold px-5 text-[13px] font-semibold text-text-inverse hover:bg-gold-hover disabled:opacity-50">{saving ? "Saving…" : project ? "Save project" : "Create and open project"}</button>
          <button type="button" disabled={saving} onClick={onCancel} className="min-h-11 rounded-md border border-border px-4 text-[13px] font-semibold text-text-secondary hover:bg-surface-hover disabled:opacity-50">Cancel</button>
        </div>
      </form>
    </section>
  );
}
