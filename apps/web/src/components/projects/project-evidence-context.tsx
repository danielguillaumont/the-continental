"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, FolderKanban } from "lucide-react";

import { EvidenceForm } from "@/components/evidence/evidence-form";
import { getProject } from "@/lib/api";
import { projectDetailsUrl } from "@/lib/project-workspace";
import type { ProjectRecord } from "@/types/project";

export function ProjectEvidenceContext({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void getProject(projectId)
      .then((record) => {
        if (!active) return;
        setProject(record);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Project not found.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [projectId]);

  if (loading) {
    return <p role="status" className="rounded-lg border border-border bg-surface p-5 text-[13px] text-text-secondary">Checking the destination project…</p>;
  }
  if (!project) {
    return (
      <div role="alert" className="rounded-lg border border-danger-border bg-danger-surface p-5">
        <div className="flex items-start gap-3">
          <AlertCircle aria-hidden="true" className="size-5 shrink-0 text-danger-text" />
          <div>
            <h2 className="text-[15px] font-semibold text-danger-text">Project unavailable</h2>
            <p className="mt-2 text-[13px] text-text-secondary">{error ?? "We couldn't verify the destination project."} No evidence has been created.</p>
            <Link href="/armory/projects" className="mt-3 inline-flex min-h-11 items-center text-[13px] font-semibold text-gold hover:underline">Return to Projects</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-5 rounded-lg border border-gold/30 bg-surface-raised p-4 sm:p-5">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.13em] text-gold">
          <FolderKanban aria-hidden="true" className="size-4" /> Destination project
        </div>
        <p className="mt-2 break-words text-[16px] font-semibold text-text-primary">{project.name}</p>
        <p className="mt-1 text-[13px] leading-6 text-text-secondary">After saving, we will attach this evidence to the project and return to its workspace. The original evidence record remains reusable.</p>
        <Link href={projectDetailsUrl(project.id)} className="mt-2 inline-flex min-h-10 items-center text-[13px] font-semibold text-gold hover:underline">Cancel and return to project</Link>
      </div>
      <EvidenceForm projectId={project.id} />
    </>
  );
}
