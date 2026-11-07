"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, FolderKanban, Plus, RefreshCw, ShieldCheck } from "lucide-react";

import { ProjectForm } from "@/components/projects/project-form";
import { AppShell } from "@/components/shell/app-shell";
import { listProjects } from "@/lib/api";
import { projectDetailsUrl, projectProofState, projectStatusLabel, proofCountLabel } from "@/lib/project-workspace";
import type { ProjectRecord } from "@/types/project";

const outlineButton = "inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border bg-surface-raised px-4 text-[13px] font-semibold text-text-secondary hover:border-border-strong hover:bg-surface-hover hover:text-text-primary disabled:opacity-50";

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let active = true;
    void listProjects()
      .then((records) => { if (active) { setProjects(records); setError(null); } })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load projects."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function refresh() {
    setRefreshing(true);
    try {
      const records = await listProjects();
      setProjects(records);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not refresh projects.");
    } finally { setRefreshing(false); }
  }

  const supported = projects.filter((project) => projectProofState(project) === "supported").length;

  return (
    <AppShell sectionLabel="Projects">
      <div className="mx-auto w-full max-w-[1160px] px-4 py-7 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <header className="flex flex-wrap items-start justify-between gap-5 border-b border-border-subtle pb-7">
          <div className="max-w-[650px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">Your career record / Projects</p>
            <h1 className="mt-2 text-[28px] font-semibold leading-tight tracking-tight text-text-primary sm:text-[32px]">Your work, in one place.</h1>
            <p className="mt-3 text-[14px] leading-6 text-text-secondary">Projects describe what you built. Open a project to manage its details and connect the evidence that proves your work.</p>
          </div>
          <button type="button" onClick={() => setCreating(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-gold px-5 text-[13px] font-semibold text-text-inverse hover:bg-gold-hover"><Plus className="size-4" aria-hidden="true" />New project</button>
        </header>

        {creating && <div className="mt-6"><ProjectForm onCancel={() => setCreating(false)} onSaved={(project) => router.push(projectDetailsUrl(project.id))} /></div>}

        {error && <div role="alert" className="mt-6 rounded-md border border-danger-border bg-danger-surface p-4 text-[13px] text-danger-text">{error} <button onClick={() => void refresh()} className="ml-2 font-semibold underline">Retry</button></div>}

        {!loading && !error && <section aria-label="Project summary" className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-surface p-5"><p className="text-[12px] text-text-secondary">Projects saved</p><p className="mt-1 text-[28px] font-semibold text-text-primary">{projects.length}</p></div>
          <div className="rounded-lg border border-border bg-surface p-5"><p className="text-[12px] text-text-secondary">With supporting proof</p><p className="mt-1 text-[28px] font-semibold text-text-primary">{supported}</p></div>
          <div className="rounded-lg border border-border bg-surface p-5"><p className="text-[12px] text-text-secondary">Waiting for proof</p><p className="mt-1 text-[28px] font-semibold text-text-primary">{projects.length - supported}</p></div>
        </section>}

        <section aria-labelledby="projects-list-heading" className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="projects-list-heading" className="text-[18px] font-semibold text-text-primary">All projects</h2>
              <p className="mt-1 text-[13px] text-text-secondary">Select a project to view its evidence and make changes.</p>
            </div>
            <button className={outlineButton} disabled={loading || refreshing} type="button" onClick={() => void refresh()}><RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />Refresh</button>
          </div>

          {loading ? <div role="status" className="mt-5 rounded-lg border border-border bg-surface p-7 text-[14px] text-text-secondary">Loading your projects…</div> : error ? null : projects.length === 0 ?
            <div className="mt-5 rounded-xl border border-border bg-surface px-5 py-12 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-xl border border-border bg-surface-raised text-gold"><FolderKanban className="size-6" aria-hidden="true" /></div>
              <h3 className="mt-4 text-[19px] font-semibold text-text-primary">Start with a project you built.</h3>
              <p className="mx-auto mt-2 max-w-lg text-[14px] leading-6 text-text-secondary">Add the name and a clear summary. You can attach supporting evidence once the project is saved.</p>
              <button type="button" onClick={() => setCreating(true)} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-gold px-5 text-[13px] font-semibold text-text-inverse hover:bg-gold-hover"><Plus className="size-4" aria-hidden="true" />Create your first project</button>
            </div>
            : <div className="mt-5 grid gap-4 md:grid-cols-2">{projects.map((project) => (
                <article key={project.id} className="flex min-w-0 flex-col rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-strong sm:p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-border-strong bg-surface-raised px-2.5 py-1 text-[11px] font-semibold text-text-secondary">{projectStatusLabel(project.status)}</span>
                    <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${projectProofState(project) === "supported" ? "text-success-text" : "text-warning-text"}`}><ShieldCheck className="size-3.5" aria-hidden="true" />{projectProofState(project) === "supported" ? "Evidence attached" : "Needs supporting proof"}</span>
                  </div>
                  <h3 className="mt-4 break-words text-[19px] font-semibold leading-snug text-text-primary">{project.name}</h3>
                  <p className="mt-2 line-clamp-3 flex-1 whitespace-pre-line break-words text-[14px] leading-6 text-text-secondary">{project.summary}</p>
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-4">
                    <span className="text-[12px] text-text-muted">{proofCountLabel(project.evidence.length)}</span>
                    <Link href={projectDetailsUrl(project.id)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-gold/50 px-4 text-[13px] font-semibold text-gold hover:bg-gold-surface">Open project <ArrowUpRight className="size-4" aria-hidden="true" /></Link>
                  </div>
                </article>
              ))}</div>}
        </section>
        <p className="mt-8 text-[13px] text-text-muted">Looking for individual proof records? <Link href="/armory" className="font-semibold text-gold hover:underline">Browse the Evidence library</Link>.</p>
      </div>
    </AppShell>
  );
}
