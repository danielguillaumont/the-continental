"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { EvidenceReviewAction, PreviousEvidenceReviews, ReviewLedgerStatus, useEvidenceReviewLedger } from "@/components/dossier/evidence-review-controls";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpRight, CheckCircle2, ChevronRight, CircleHelp, FileSearch2,
  FolderKanban, Link2, ListChecks, RefreshCw, ShieldAlert, ShieldCheck,
} from "lucide-react";
import { getOpportunityEvidenceMatchPreview } from "@/lib/api";
import { safeSourceUrl } from "@/lib/dossier-workspace";
import {
  evidenceMatchOutcomeExplanation, evidenceMatchOutcomeLabel,
  filterEvidenceMatchRequirements,
} from "@/lib/dossier-evidence-match";
import type { EvidenceMatchFilter } from "@/lib/dossier-evidence-match";
import type { EvidenceMatchCandidate, EvidenceMatchPreview, EvidenceMatchRequirement } from "@/types/dossier-evidence-match";

const filters: { value: EvidenceMatchFilter; label: string }[] = [
  { value: "all", label: "All requirements" },
  { value: "candidates", label: "With candidates" },
  { value: "review", label: "Review needed" },
];

function OutcomeMarker({ requirement }: { requirement: EvidenceMatchRequirement }) {
  const found = requirement.outcome === "candidates_found";
  const unmatched = requirement.outcome === "no_linked_evidence";
  const label = evidenceMatchOutcomeLabel(requirement.outcome);
  return <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-semibold ${
    found ? "border-success-border bg-success-surface text-success-text" :
      unmatched ? "border-warning-border bg-warning-surface text-warning-text" :
        "border-info-border bg-info-surface text-info-text"
  }`}>
    {found ? <CheckCircle2 className="size-3.5" /> : unmatched ? <ShieldAlert className="size-3.5" /> : <CircleHelp className="size-3.5" />}
    {label}
  </span>;
}

function EvidenceCard({ candidate, matchingSkills, reviewSlot }: { candidate: EvidenceMatchCandidate; matchingSkills: string[]; reviewSlot?: ReactNode }) {
  const sourceUrl = safeSourceUrl(candidate.sourceUrl);
  return <li className="rounded-lg border border-border bg-surface-raised p-4 transition-colors hover:border-border-strong sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-text-muted"><FileSearch2 aria-hidden="true" className="size-3.5 text-gold" /> Evidence record / {candidate.kind.replaceAll("_", " ")}</p>
        <h4 className="mt-2 break-words text-[15px] font-semibold leading-6 text-text-primary">{candidate.title}</h4>
      </div>
      <span className={`shrink-0 rounded-md border px-2 py-1 text-[10px] font-semibold ${candidate.ownerStatus === "verified" ? "border-gold/30 bg-gold-surface text-gold" : "border-border-strong text-text-secondary"}`}>
        {candidate.ownerStatus === "verified" ? "Owner marked verified" : "Unverified"}
      </span>
    </div>
    {matchingSkills.length > 0 && <div className="mt-3 flex flex-wrap items-center gap-1.5"><span className="mr-1 text-[11px] text-text-muted">Linked through</span>{matchingSkills.map((skill) => <span key={skill} className="rounded-md border border-gold/20 bg-gold-surface px-2 py-1 text-[11px] text-gold">{skill}</span>)}</div>}
    {candidate.projects.length > 0 && <div className="mt-4 space-y-1.5"><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-muted">Related projects</p>{candidate.projects.map((project) => <Link key={project.id} href={`/armory/projects/${encodeURIComponent(project.id)}`} className="flex min-h-8 items-center gap-2 break-words text-[12px] font-semibold text-text-secondary hover:text-gold"><FolderKanban aria-hidden="true" className="size-3.5 shrink-0" />{project.name}<ArrowUpRight aria-hidden="true" className="size-3 shrink-0" /></Link>)}</div>}
    {candidate.experiences.length > 0 && <div className="mt-4 space-y-1"><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-muted">Related experience</p>{candidate.experiences.map((experience) => <p key={experience.id} className="text-[12px] leading-5 text-text-secondary">{experience.title} · {experience.organization}</p>)}</div>}
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-3">
      <span className="break-words text-[11px] text-text-muted">{candidate.sourceLabel || "Source not specified"}</span>
      <div className="flex flex-wrap items-center gap-4">
        {sourceUrl && <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-8 items-center gap-1.5 text-[11px] font-semibold text-text-secondary hover:text-gold">Original source <ArrowUpRight aria-hidden="true" className="size-3.5" /></a>}
        <Link href={`/armory/${encodeURIComponent(candidate.id)}`} className="inline-flex min-h-8 items-center gap-1.5 text-[12px] font-semibold text-gold hover:underline">Inspect evidence <ArrowUpRight aria-hidden="true" className="size-3.5" /></Link>
      </div>
    </div>
    {reviewSlot}
  </li>;
}

export function EvidenceMatchWorkspace({ opportunityId }: { opportunityId: string }) {
  const [preview, setPreview] = useState<EvidenceMatchPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filter, setFilter] = useState<EvidenceMatchFilter>("all");
  const reviewLedger = useEvidenceReviewLedger(opportunityId);
  const requestSequence = useRef(0);

  const refresh = useCallback(async () => {
    const sequence = ++requestSequence.current;
    setLoading(true);
    setError(null);
    try {
      const result = await getOpportunityEvidenceMatchPreview(opportunityId);
      if (requestSequence.current !== sequence) return;
      setPreview(result);
      setActiveId((current) => result.requirements.some((item) => item.id === current) ? current : null);
    } catch (cause: unknown) {
      if (requestSequence.current !== sequence) return;
      setPreview(null);
      setError(cause instanceof Error ? cause.message : "Could not load Evidence Match.");
    } finally {
      if (requestSequence.current === sequence) setLoading(false);
    }
  }, [opportunityId]);

  // Initial loading starts in the effect. State updates happen only after
  // the HTTP promise settles, avoiding synchronous setState in an effect.
  useEffect(() => {
    const sequence = ++requestSequence.current;
    void getOpportunityEvidenceMatchPreview(opportunityId).then(
      (result) => {
        if (requestSequence.current !== sequence) return;
        setPreview(result);
        setError(null);
        setActiveId((current) => result.requirements.some((item) => item.id === current) ? current : null);
      },
      (cause: unknown) => {
        if (requestSequence.current !== sequence) return;
        setPreview(null);
        setError(cause instanceof Error ? cause.message : "Could not load Evidence Match.");
      },
    ).finally(() => {
      if (requestSequence.current === sequence) setLoading(false);
    });
    return () => { requestSequence.current += 1; };
  }, [opportunityId]);

  const visibleRequirements = preview ? filterEvidenceMatchRequirements(preview.requirements, filter) : [];
  const selected = visibleRequirements.find((item) => item.id === activeId) ?? visibleRequirements[0] ?? null;
  const reviewCount = preview ? preview.summary.noLinkedEvidence + preview.summary.noExplicitSkillTag : 0;

  return <section id="evidence-match" aria-labelledby="evidence-match-heading" className="mt-7 scroll-mt-24 overflow-hidden rounded-xl border border-border bg-surface">
    <div className="relative overflow-hidden border-b border-border-subtle bg-[radial-gradient(ellipse_at_top_right,rgba(184,154,91,0.12),transparent_55%)] px-5 py-6 sm:px-7 sm:py-7">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0 max-w-2xl">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold"><ListChecks aria-hidden="true" className="size-4" /> Dossier / Evidence Match</p>
          <h2 id="evidence-match-heading" className="mt-2 font-display text-[31px] leading-tight text-text-primary sm:text-[36px]">From requirements to evidence.</h2>
          <p className="mt-3 text-[13px] leading-6 text-text-secondary">Explore which saved career records might support each job requirement, and which requirements still need interpretation. Every result links back to inspectable evidence.</p>
        </div>
        <button type="button" disabled={loading} onClick={() => void refresh()} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md border border-border-strong bg-surface/80 px-3.5 text-[12px] font-semibold text-text-primary hover:border-gold hover:text-gold disabled:opacity-50"><RefreshCw aria-hidden="true" className={`size-4 ${loading ? "animate-spin" : ""}`} />Refresh matches</button>
      </div>
      {preview && !error && <div className="mt-7 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border/70 bg-canvas/55 p-4"><p className="text-[11px] text-text-secondary">Requirements</p><p className="mt-1 font-display text-[33px] leading-none text-text-primary">{preview.summary.totalRequirements}</p><p className="mt-2 text-[11px] text-text-muted">Saved in this Dossier</p></div>
        <div className="rounded-lg border border-success-border/70 bg-success-surface/55 p-4"><p className="text-[11px] text-success-text">With evidence candidates</p><p className="mt-1 font-display text-[33px] leading-none text-text-primary">{preview.summary.candidatesFound}</p><p className="mt-2 text-[11px] text-success-text/80">Candidate records to inspect</p></div>
        <div className="rounded-lg border border-warning-border/60 bg-warning-surface/45 p-4"><p className="text-[11px] text-warning-text">Review needed</p><p className="mt-1 font-display text-[33px] leading-none text-text-primary">{reviewCount}</p><p className="mt-2 text-[11px] text-warning-text/80">No candidates identified yet</p></div>
      </div>}
    </div>

    <ReviewLedgerStatus state={reviewLedger} />
    {loading && !preview ? <p role="status" className="px-5 py-9 text-[13px] text-text-secondary sm:px-7">Finding candidate evidence across saved skill records…</p> : error ? <div role="alert" className="m-5 rounded-lg border border-danger-border bg-danger-surface p-4 sm:m-7"><p className="text-[13px] font-semibold text-danger-text">Evidence Match is unavailable</p><p className="mt-2 break-words text-[12px] text-danger-text">{error}</p><button type="button" className="mt-3 min-h-9 rounded-md border border-danger-border px-3 text-[12px] font-semibold text-danger-text hover:bg-danger-surface" onClick={() => void refresh()}>Try again</button></div> : preview && preview.requirements.length === 0 ? <div className="px-5 py-8 sm:px-7"><p className="text-[14px] font-semibold text-text-primary">No requirements to match yet.</p><p className="mt-2 text-[12px] leading-5 text-text-secondary">Add or approve requirements below, then refresh this workspace to discover candidate evidence.</p></div> : preview ? <>
      <div className="border-b border-border-subtle px-5 py-4 sm:px-7">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter requirements by evidence outcome">
          {filters.map((option) => <button key={option.value} type="button" aria-pressed={filter === option.value} onClick={() => { setFilter(option.value); setActiveId(null); }} className={`min-h-9 rounded-md border px-3 text-[11px] font-semibold transition-colors ${filter === option.value ? "border-gold/60 bg-gold-surface text-gold" : "border-border bg-surface-raised text-text-secondary hover:border-border-strong hover:text-text-primary"}`}>{option.label}{option.value === "review" ? ` · ${reviewCount}` : option.value === "candidates" ? ` · ${preview.summary.candidatesFound}` : ` · ${preview.summary.totalRequirements}`}</button>)}
        </div>
      </div>
      {selected ? <div className="grid min-w-0 gap-0 lg:grid-cols-[minmax(0,0.79fr)_minmax(0,1.21fr)]">
        <div className="border-b border-border-subtle lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3 sm:px-7"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">Requirement navigator</p><span className="text-[11px] text-text-muted">{visibleRequirements.length} shown</span></div>
          <ul className="max-h-[620px] overflow-y-auto p-2.5 sm:p-3">
            {visibleRequirements.map((item, i) => <li key={item.id}><button type="button" aria-current={selected.id === item.id ? "true" : undefined} onClick={() => setActiveId(item.id)} className={`flex w-full min-w-0 items-start gap-3 rounded-lg border p-3 text-left transition-colors sm:p-4 ${selected.id === item.id ? "border-gold/45 bg-gold-surface/55" : "border-transparent hover:border-border hover:bg-surface-hover"}`}><span className={`mt-0.5 font-mono text-[11px] font-semibold ${selected.id === item.id ? "text-gold" : "text-text-muted"}`}>{String(i + 1).padStart(2, "0")}</span><span className="min-w-0 flex-1"><span className="line-clamp-2 text-[12px] font-medium leading-5 text-text-primary">{item.text}</span><span className="mt-2 flex flex-wrap items-center gap-1.5"><span className="text-[10px] text-text-muted">{item.kind === "required" ? "Required" : "Preferred"}</span><span aria-hidden="true" className="text-text-disabled">·</span><span className={`text-[10px] font-semibold ${item.outcome === "candidates_found" ? "text-success-text" : "text-warning-text"}`}>{item.outcome === "candidates_found" ? `${item.candidateCount} evidence candidate${item.candidateCount === 1 ? "" : "s"}` : "Review needed"}</span></span></span><ChevronRight aria-hidden="true" className={`mt-1 size-4 shrink-0 ${selected.id === item.id ? "text-gold" : "text-text-disabled"}`} /></button></li>)}
          </ul>
        </div>
        <div className="min-w-0 px-5 py-6 sm:px-7 sm:py-7" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">Selected / {selected.kind === "required" ? "Required" : "Preferred"}</p><OutcomeMarker requirement={selected} /></div>
          <h3 className="mt-4 whitespace-pre-wrap break-words text-[18px] font-semibold leading-7 text-text-primary">{selected.text}</h3>
          <p className="mt-3 text-[12px] leading-6 text-text-secondary">{evidenceMatchOutcomeExplanation(selected.outcome)}</p>
          {selected.matchedSkills.length > 0 && <div className="mt-5"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">Explicitly recognized skill tags</p><div className="mt-2 flex flex-wrap gap-1.5">{selected.matchedSkills.map((skill) => <span key={skill.id} className="rounded-md border border-border-strong bg-surface-raised px-2.5 py-1 text-[11px] font-medium text-text-primary" title={`Requirement phrase: ${skill.requirementPhrase}`}>{skill.name}</span>)}</div></div>}
          {selected.evidenceCandidates.length > 0 ? <div className="mt-7"><div className="flex flex-wrap items-end justify-between gap-2"><h4 className="text-[13px] font-semibold text-text-primary">Supporting evidence candidates</h4><span className="text-[11px] text-text-muted">{selected.candidateCount} available</span></div><ul className="mt-3 space-y-3">{selected.evidenceCandidates.map((candidate) => <EvidenceCard key={`${selected.id}-${candidate.id}`} candidate={candidate} matchingSkills={selected.matchedSkills.filter((skill) => candidate.matchedSkillIds.includes(skill.id)).map((skill) => skill.name)} reviewSlot={<EvidenceReviewAction requirementId={selected.id} candidate={candidate} state={reviewLedger} />} />)}</ul>{selected.truncated && <p className="mt-3 rounded-md border border-warning-border bg-warning-surface p-3 text-[12px] text-warning-text">Only the first {selected.evidenceCandidates.length} of {selected.candidateCount} candidates are shown. Inspect the Evidence library for the remaining records.</p>}</div> : <div className="mt-7 rounded-lg border border-dashed border-border-strong bg-surface-raised p-5"><ShieldAlert aria-hidden="true" className="size-6 text-warning-text" /><p className="mt-3 text-[13px] font-semibold text-text-primary">No evidence candidate returned</p><p className="mt-2 text-[12px] leading-6 text-text-secondary">This requirement needs manual review. It may be unsupported, phrased differently from your saved skills, or simply not linked yet.</p><Link href="/armory" className="mt-3 inline-flex min-h-9 items-center gap-2 text-[12px] font-semibold text-gold hover:underline">Explore the Evidence library <ArrowUpRight aria-hidden="true" className="size-4" /></Link></div>}
          <PreviousEvidenceReviews requirement={selected} state={reviewLedger} />
        </div>
      </div> : <div className="px-5 py-7 sm:px-7"><p className="text-[13px] text-text-secondary">No requirements in this filter. Choose another filter to inspect the saved results.</p></div>}
      <div className="flex flex-wrap items-start gap-2 border-t border-border-subtle bg-canvas/30 px-5 py-4 sm:px-7"><ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-gold" /><p className="min-w-0 flex-1 text-[11px] leading-5 text-text-secondary"><span className="font-semibold text-text-primary">Interpretation boundary.</span> {preview.caveat} Owner verification flags are self-reported; no ranking or AI judgment is generated by this preview.</p><span className="inline-flex items-center gap-1 font-mono text-[10px] text-text-muted"><Link2 aria-hidden="true" className="size-3" /> Candidate preview only</span></div>
    </> : null}
  </section>;
}
