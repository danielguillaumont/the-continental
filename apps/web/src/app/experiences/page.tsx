"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, BriefcaseBusiness, CalendarRange, Plus, RefreshCw, Search, ShieldCheck } from "lucide-react";

import { ExperienceForm } from "@/components/experiences/experience-form";
import { AppShell } from "@/components/shell/app-shell";
import { listExperiences } from "@/lib/api";
import { employmentLabels, experiencePeriod, experienceProofCount, experienceUrl, filterExperiences, isCurrentExperience } from "@/lib/experience-workspace";
import type { ExperienceRecord } from "@/types/experience";

const borderButton = "inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border bg-surface-raised px-4 text-[13px] font-semibold text-text-secondary hover:border-border-strong hover:bg-surface-hover hover:text-text-primary disabled:opacity-50";

export default function ExperiencesPage() {
  const router = useRouter();
  const [records, setRecords] = useState<ExperienceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void listExperiences()
      .then((items) => { if (active) { setRecords(items); setError(null); } })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load experiences."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function refresh() {
    setRefreshing(true);
    try { setRecords(await listExperiences()); setError(null); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not refresh experiences."); }
    finally { setRefreshing(false); }
  }

  const filtered = filterExperiences(records, query);
  const current = records.filter(isCurrentExperience).length;
  const supported = records.filter((record) => experienceProofCount(record) > 0).length;

  return (
    <AppShell sectionLabel="Experience">
      <div className="mx-auto w-full max-w-[1160px] px-4 py-7 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <header className="flex flex-wrap items-start justify-between gap-5 border-b border-border-subtle pb-7">
          <div className="max-w-[680px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">Your career record / Experience</p>
            <h1 className="mt-2 text-[28px] font-semibold leading-tight tracking-tight text-text-primary sm:text-[32px]">The roles behind your work.</h1>
            <p className="mt-3 text-[14px] leading-6 text-text-secondary">Build a reliable record of where you worked, what you accomplished, and the projects and evidence that support each role.</p>
          </div>
          <button type="button" onClick={() => setCreating((previous) => !previous)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-gold px-5 text-[13px] font-semibold text-text-inverse hover:bg-gold-hover"><Plus className="size-4" aria-hidden="true" />Add experience</button>
        </header>

        {creating && <div className="mt-6"><ExperienceForm onCancel={() => setCreating(false)} onSaved={(record) => router.push(experienceUrl(record.id))} /></div>}

        {error && <div role="alert" className="mt-6 rounded-lg border border-danger-border bg-danger-surface p-4 text-[13px] text-danger-text">{error} <button type="button" className="ml-2 font-semibold underline" onClick={() => void refresh()}>Retry</button></div>}

        {!loading && !error && <section aria-label="Experience summary" className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-surface p-5"><BriefcaseBusiness aria-hidden="true" className="size-5 text-gold" /><p className="mt-3 text-[12px] text-text-secondary">Roles recorded</p><p className="mt-1 text-[28px] font-semibold text-text-primary">{records.length}</p></div>
          <div className="rounded-lg border border-border bg-surface p-5"><CalendarRange aria-hidden="true" className="size-5 text-gold" /><p className="mt-3 text-[12px] text-text-secondary">Current roles</p><p className="mt-1 text-[28px] font-semibold text-text-primary">{current}</p></div>
          <div className="rounded-lg border border-border bg-surface p-5"><ShieldCheck aria-hidden="true" className="size-5 text-gold" /><p className="mt-3 text-[12px] text-text-secondary">With supporting records</p><p className="mt-1 text-[28px] font-semibold text-text-primary">{supported}</p></div>
        </section>}

        <section aria-labelledby="experience-list-heading" className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="experience-list-heading" className="text-[18px] font-semibold text-text-primary">Employment & engagements</h2>
              <p className="mt-1 text-[13px] text-text-secondary">Each role is its own record. Evidence and projects remain reusable.</p>
            </div>
            <button type="button" disabled={loading || refreshing} onClick={() => void refresh()} className={borderButton}><RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />Refresh</button>
          </div>

          {records.length > 0 && !error && <label className="mt-5 flex max-w-lg items-center gap-3 rounded-md border border-border bg-surface-raised px-3 focus-within:border-gold"><Search aria-hidden="true" className="size-4 shrink-0 text-text-muted" /><span className="sr-only">Search experience records</span><input type="search" placeholder="Search employers, roles, locations…" value={query} onChange={(event) => setQuery(event.target.value)} className="min-h-11 w-full min-w-0 bg-transparent text-[14px] text-text-primary outline-none placeholder:text-text-muted" /></label>}

          {loading ? <div role="status" className="mt-5 rounded-lg border border-border bg-surface p-7 text-[14px] text-text-secondary">Loading your experience…</div> : error ? null : records.length === 0 ?
            <div className="mt-5 rounded-xl border border-border bg-surface px-5 py-12 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-xl border border-border bg-surface-raised text-gold"><BriefcaseBusiness className="size-6" aria-hidden="true" /></div>
              <h3 className="mt-4 text-[19px] font-semibold text-text-primary">Start with a role you held.</h3>
              <p className="mx-auto mt-2 max-w-lg text-[14px] leading-6 text-text-secondary">Add a real position, engagement, internship, or volunteer role. You can connect your work and evidence after saving.</p>
              <button type="button" onClick={() => setCreating(true)} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-gold px-5 text-[13px] font-semibold text-text-inverse hover:bg-gold-hover"><Plus className="size-4" aria-hidden="true" />Add your first experience</button>
            </div>
            : filtered.length === 0 ? <div className="mt-5 rounded-xl border border-border bg-surface p-7 text-[13px] text-text-secondary">No roles match your search. Try a different keyword.</div>
            : <div className="mt-5 grid gap-4 md:grid-cols-2">
              {filtered.map((record) => <article key={record.id} className="flex min-w-0 flex-col rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-strong sm:p-6">
                <div className="flex flex-wrap gap-2"><span className="rounded-md border border-border-strong bg-surface-raised px-2 py-1 text-[11px] font-semibold text-text-secondary">{isCurrentExperience(record) ? "Current role" : "Previous role"}</span>{record.employmentType && <span className="rounded-md border border-border bg-surface-raised px-2 py-1 text-[11px] text-text-muted">{employmentLabels[record.employmentType]}</span>}</div>
                <h3 className="mt-4 break-words text-[18px] font-semibold text-text-primary">{record.title}</h3>
                <p className="mt-1 break-words text-[13px] font-medium text-gold">{record.organization}</p>
                <p className="mt-3 text-[12px] text-text-secondary">{experiencePeriod(record)}{record.location ? ` · ${record.location}` : ""}</p>
                <p className="mt-4 line-clamp-3 whitespace-pre-wrap break-words text-[13px] leading-6 text-text-secondary">{record.description}</p>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-5 sm:mt-5"><span className="text-[12px] text-text-muted">{experienceProofCount(record)} supporting records</span><Link href={experienceUrl(record.id)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border-strong px-3 text-[12px] font-semibold text-text-primary hover:border-gold hover:text-gold">Open role <ArrowUpRight aria-hidden="true" className="size-4" /></Link></div>
              </article>)}
            </div>}
        </section>
      </div>
    </AppShell>
  );
}
