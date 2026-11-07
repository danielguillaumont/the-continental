"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, BookOpenCheck, Filter, LibraryBig, RefreshCw, Search, ShieldCheck, Tags } from "lucide-react";

import { AppShell } from "@/components/shell/app-shell";
import { listSkills } from "@/lib/api";
import { countSkillCoverage, filterSkills, proofCountLabel, skillCoverageLabels, skillUrl } from "@/lib/skill-workspace";
import type { SkillCoverage, SkillSummary } from "@/types/skill";

const cardBase = "rounded-xl border border-border bg-surface p-5 sm:p-6";
const statusClass: Record<SkillCoverage, string> = {
  verified: "bg-success-surface text-success-text",
  unverified: "bg-warning-surface text-warning-text",
  unsupported: "bg-neutral-status-surface text-neutral-status-text",
};

export default function SkillsPage() {
  const [records, setRecords] = useState<SkillSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [coverage, setCoverage] = useState<SkillCoverage | "all">("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void listSkills()
      .then((items) => { if (active) { setRecords(items); setError(null); } })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Skills could not be loaded."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function refresh() {
    setRefreshing(true);
    try { setRecords(await listSkills()); setError(null); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Skills could not be refreshed."); }
    finally { setRefreshing(false); }
  }

  const filtered = filterSkills(records, query, coverage);

  return (
    <AppShell sectionLabel="Skills">
      <div className="mx-auto w-full max-w-[1100px] px-4 py-7 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="flex flex-col gap-5 border-b border-border-subtle pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-gold">Your career record / skills</p>
            <h1 className="mt-2 text-[25px] font-semibold tracking-tight text-text-primary sm:text-[28px]">What you know. What you can prove.</h1>
            <p className="mt-2 text-[13px] leading-6 text-text-secondary">Explore the skills named in your evidence. Open a skill to inspect the exact records behind it, including verification and source details.</p>
          </div>
          <Link href="/armory/new" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-gold px-4 text-[13px] font-semibold text-text-inverse hover:bg-gold-hover">
            <LibraryBig aria-hidden="true" className="size-4" /> Add evidence
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Skill coverage summary">
          <div className={cardBase}><Tags aria-hidden="true" className="size-4 text-gold" /><p className="mt-3 text-[12px] text-text-secondary">Skills recorded</p><p className="mt-1 text-[25px] font-semibold">{records.length}</p></div>
          <div className={cardBase}><ShieldCheck aria-hidden="true" className="size-4 text-success-text" /><p className="mt-3 text-[12px] text-text-secondary">With verified evidence</p><p className="mt-1 text-[25px] font-semibold">{countSkillCoverage(records, "verified")}</p></div>
          <div className={cardBase}><BookOpenCheck aria-hidden="true" className="size-4 text-warning-text" /><p className="mt-3 text-[12px] text-text-secondary">Without verified evidence</p><p className="mt-1 text-[25px] font-semibold">{countSkillCoverage(records, "unverified") + countSkillCoverage(records, "unsupported")}</p></div>
        </div>

        <div className="mt-5 rounded-lg border border-border bg-surface-raised px-4 py-3 text-[12px] leading-5 text-text-secondary">
          <strong className="text-text-primary">Evidence-derived, not self-rated.</strong> A verified label reflects the status saved on an evidence record; it is not an independent assessment of skill proficiency.
        </div>

        <div className="mt-7 flex flex-wrap items-end justify-between gap-4">
          <div><h2 className="text-[17px] font-semibold">Skill inventory</h2><p className="mt-1 text-[12px] text-text-muted">{filtered.length} of {records.length} skills shown</p></div>
          <button type="button" disabled={refreshing} onClick={() => void refresh()} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border bg-surface-raised px-3 text-[12px] font-semibold text-text-primary hover:bg-surface-hover disabled:opacity-50"><RefreshCw aria-hidden="true" className="size-4" />{refreshing ? "Refreshing…" : "Refresh"}</button>
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 sm:flex-row" aria-label="Skill search and filters">
          <label className="relative block min-w-0 flex-1">
            <span className="sr-only">Search skills</span><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search skill names…" className="min-h-11 w-full rounded-md border border-border bg-surface-raised py-2 pl-10 pr-3 text-[13px] text-text-primary placeholder:text-text-muted" />
          </label>
          <label className="flex min-w-0 items-center gap-2 sm:w-[250px]"><Filter aria-hidden="true" className="size-4 shrink-0 text-text-muted" /><span className="sr-only">Filter by proof status</span><select value={coverage} onChange={(event) => setCoverage(event.target.value as SkillCoverage | "all")} className="min-h-11 w-full min-w-0 rounded-md border border-border bg-surface-raised px-3 text-[13px] text-text-primary"><option value="all">All proof statuses</option><option value="verified">Verified evidence present</option><option value="unverified">Unverified only</option><option value="unsupported">No evidence</option></select></label>
        </div>

        {error && <div role="alert" className="mt-5 rounded-lg border border-danger-border bg-danger-surface px-4 py-3 text-[13px] text-danger-text">Could not load skill proof. {error} <button className="ml-2 underline" type="button" onClick={() => void refresh()}>Retry</button></div>}
        {loading ? <p role="status" className="mt-7 text-[13px] text-text-muted">Loading skill inventory…</p> : !error && records.length === 0 ? (
          <section className="mt-5 rounded-xl border border-border bg-surface px-5 py-12 text-center"><Tags aria-hidden="true" className="mx-auto size-7 text-gold" /><h2 className="mt-4 text-[17px] font-semibold">Your skills appear as you add evidence.</h2><p className="mx-auto mt-2 max-w-md text-[13px] leading-6 text-text-secondary">Start by saving a project artifact, accomplishment, certification, or other real proof, then tag the skills it demonstrates.</p><Link href="/armory/new" className="mt-5 inline-flex min-h-11 items-center rounded-md bg-gold px-4 text-[13px] font-semibold text-text-inverse">Create your first evidence record</Link></section>
        ) : !error && filtered.length === 0 ? (
          <p role="status" className="mt-5 rounded-lg border border-border bg-surface p-6 text-[13px] text-text-secondary">No skills match these filters. Try another search or proof status.</p>
        ) : !error ? (
          <ul className="mt-5 grid gap-3 sm:grid-cols-2" aria-label="Saved skills">
            {filtered.map((skill) => <li key={skill.id} className="min-w-0">
              <Link href={skillUrl(skill.id)} className="group flex h-full min-h-[158px] flex-col justify-between rounded-xl border border-border bg-surface p-5 transition-colors hover:border-gold-muted hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-gold">
                <div className="flex min-w-0 justify-between gap-3"><div className="min-w-0"><p className="break-words text-[17px] font-semibold text-text-primary group-hover:text-gold">{skill.name}</p><p className="mt-1 text-[12px] text-text-muted">{proofCountLabel(skill.evidenceCount)} · {skill.verifiedCount} verified</p></div><ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-gold" /></div>
                <span className={`mt-5 inline-flex self-start rounded-md px-2.5 py-1.5 text-[11px] font-semibold ${statusClass[skill.coverage]}`}>{skillCoverageLabels[skill.coverage]}</span>
              </Link>
            </li>)}
          </ul>
        ) : null}
      </div>
    </AppShell>
  );
}
