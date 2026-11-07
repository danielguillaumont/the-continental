import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { EvidenceForm } from "@/components/evidence/evidence-form";
import { ProjectEvidenceContext } from "@/components/projects/project-evidence-context";
import { AppShell } from "@/components/shell/app-shell";
import { isProjectContextId } from "@/lib/project-evidence-flow";
import { projectDetailsUrl } from "@/lib/project-workspace";

type PageProps = { searchParams: Promise<{ project?: string | string[] }> };

export default async function NewEvidencePage({ searchParams }: PageProps) {
  const { project: rawProject } = await searchParams;
  const projectId = isProjectContextId(rawProject) ? rawProject : null;
  const invalidContext = rawProject !== undefined && !projectId;

  return (
    <AppShell sectionLabel="Evidence">
      <div className="mx-auto w-full max-w-[1100px] px-4 py-7 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="border-b border-border-subtle pb-7">
          <Link
            href={projectId ? projectDetailsUrl(projectId) : "/armory"}
            className="inline-flex min-h-11 items-center gap-2 text-[12px] font-medium text-text-muted transition-colors duration-150 hover:text-text-primary"
          >
            <ArrowLeft aria-hidden="true" className="size-4" strokeWidth={1.8} />
            {projectId ? "Back to project" : "Back to Evidence"}
          </Link>
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.15em] text-gold">
            {projectId ? "Projects / New supporting evidence" : "Evidence / New Evidence"}
          </p>
          <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-text-primary sm:text-[24px]">
            {projectId ? "Add proof to this project." : "Add evidence."}
          </h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-6 text-text-secondary">
            {projectId
              ? "Create a reusable evidence record and attach it to the project in one workflow."
              : "Capture a real project, experience, certification, education item, or artifact that can support future career claims."}
          </p>
        </div>
        <div className="py-7">
          {invalidContext ? (
            <div role="alert" className="rounded-lg border border-danger-border bg-danger-surface p-5 text-[13px] text-danger-text">
              This project link is invalid. No evidence has been created. <Link className="font-semibold underline" href="/armory/projects">Return to Projects</Link>.
            </div>
          ) : projectId ? (
            <ProjectEvidenceContext projectId={projectId} />
          ) : (
            <EvidenceForm />
          )}
        </div>
      </div>
    </AppShell>
  );
}
