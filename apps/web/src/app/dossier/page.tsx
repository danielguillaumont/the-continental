"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, BriefcaseBusiness, FilePlus2, FileSearch, RefreshCw, Search, ShieldCheck, Tags } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { listOpportunities } from "@/lib/api";
import { dateLabel, dossierUrl, filterOpportunities, opportunityLabel, requirementCount } from "@/lib/dossier-workspace";
import type { OpportunityRecord } from "@/types/dossier";

export default function DossierPage() {
  const [records, setRecords] = useState<OpportunityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void listOpportunities().then((items) => { if (active) { setRecords(items); setError(null); } })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load the Dossier registry."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function refresh() {
    setRefreshing(true);
    try { setRecords(await listOpportunities()); setError(null); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not refresh Dossiers."); }
    finally { setRefreshing(false); }
  }

  const filtered = filterOpportunities(records, query);
  const requirementTotal = records.reduce((sum, record) => sum + requirementCount(record), 0);
  const manual = records.filter((record) => record.extractionStatus === "not_run").length;
  return <AppShell sectionLabel="Dossier">
    <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <header className="flex flex-wrap items-end justify-between gap-5 border-b border-border-subtle pb-7">
        <div className="max-w-[720px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">Opportunity intelligence / Dossier</p>
          <h1 className="mt-2 font-display text-[39px] leading-tight text-text-primary sm:text-[46px]">A closer look at the opportunity.</h1>
          <p className="mt-3 text-[14px] leading-6 text-text-secondary">A private workspace for the real job postings you are considering. Keep the original text, then organize the requirements and details without inventing anything.</p>
        </div>
        <Link href="/dossier/new" className="inline-flex min-h-11 items-center gap-2 rounded-md bg-gold px-5 text-[13px] font-semibold text-text-inverse hover:bg-gold-hover"><FilePlus2 className="size-4" /> New Dossier</Link>
      </header>

      {!loading && !error && <section aria-label="Opportunity overview" className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-5"><BriefcaseBusiness aria-hidden="true" className="size-5 text-gold" /><p className="mt-3 text-[12px] text-text-secondary">Opportunities saved</p><p className="mt-1 text-[28px] font-semibold text-text-primary">{records.length}</p></div>
        <div className="rounded-lg border border-border bg-surface p-5"><Tags aria-hidden="true" className="size-5 text-gold" /><p className="mt-3 text-[12px] text-text-secondary">Requirements recorded</p><p className="mt-1 text-[28px] font-semibold text-text-primary">{requirementTotal}</p></div>
        <div className="rounded-lg border border-border bg-surface p-5"><ShieldCheck aria-hidden="true" className="size-5 text-gold" /><p className="mt-3 text-[12px] text-text-secondary">Awaiting AI extraction</p><p className="mt-1 text-[28px] font-semibold text-text-primary">{manual}</p></div>
      </section>}

      <section className="mt-9" aria-labelledby="registry-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><h2 id="registry-heading" className="text-[18px] font-semibold text-text-primary">Opportunity registry</h2><p className="mt-1 text-[13px] text-text-secondary">Source-preserving records. No ranking or match scores in this release.</p></div>
          <button type="button" onClick={() => void refresh()} disabled={loading || refreshing} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border px-3 text-[12px] font-semibold text-text-secondary hover:border-border-strong hover:text-text-primary disabled:opacity-50"><RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />Refresh</button>
        </div>
        {records.length > 0 && !error && <label className="mt-5 flex max-w-xl items-center gap-2 rounded-md border border-border bg-surface-raised px-3 focus-within:border-gold"><Search className="size-4 shrink-0 text-text-muted" /><span className="sr-only">Search opportunities</span><input type="search" className="min-h-11 w-full min-w-0 bg-transparent text-[14px] text-text-primary outline-none placeholder:text-text-muted" placeholder="Find company, title, location or technology…" value={query} onChange={(event) => setQuery(event.target.value)} /></label>}
        {error && <p role="alert" className="mt-5 rounded-lg border border-danger-border bg-danger-surface p-4 text-[13px] text-danger-text">{error} <button type="button" className="ml-2 underline" onClick={() => void refresh()}>Retry</button></p>}
        {loading ? <div role="status" className="mt-5 rounded-lg border border-border bg-surface p-7 text-[13px] text-text-secondary">Loading opportunity records…</div> : error ? null : records.length === 0 ?
          <div className="mt-5 rounded-xl border border-border bg-surface px-6 py-14 text-center"><FileSearch className="mx-auto size-10 text-gold" /><h3 className="mt-4 text-[21px] font-semibold text-text-primary">The registry is ready.</h3><p className="mx-auto mt-2 max-w-md text-[14px] leading-6 text-text-secondary">Paste your first job posting. The original text stays intact while you manually organize details and requirements.</p><Link href="/dossier/new" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md bg-gold px-5 text-[13px] font-semibold text-text-inverse hover:bg-gold-hover">Open your first Dossier <ArrowUpRight className="size-4" /></Link></div>
          : filtered.length === 0 ? <p className="mt-5 rounded-lg border border-border bg-surface p-7 text-[13px] text-text-secondary">No opportunities match that search. Try another keyword.</p>
          : <div className="mt-5 grid gap-4 md:grid-cols-2">{filtered.map((record) => <article key={record.id} className="flex min-w-0 flex-col rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-strong sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3"><span className="rounded-md border border-gold/30 bg-gold-surface px-2.5 py-1 text-[11px] font-semibold text-gold">{record.extractionStatus === "not_run" ? "Manual record" : record.extractionStatus === "completed" ? "Extracted record" : "Extraction failed"}</span><span className="text-[11px] text-text-muted">Saved {dateLabel(record.createdAt)}</span></div>
            <h3 className="mt-4 break-words text-[20px] font-semibold leading-snug text-text-primary">{opportunityLabel(record)}</h3>
            <p className="mt-1 break-words text-[13px] font-medium text-gold">{record.company || "Company not specified"}</p>
            <p className="mt-3 text-[12px] text-text-secondary">{[record.location, record.employmentType].filter(Boolean).join(" · ") || "Location and type not recorded"}</p>
            {record.technologies.length > 0 && <ul className="mt-4 flex flex-wrap gap-1.5">{record.technologies.slice(0, 5).map((tech) => <li key={tech} className="rounded-md border border-border bg-surface-raised px-2 py-1 text-[11px] text-text-secondary">{tech}</li>)}</ul>}
            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-5 sm:mt-6"><span className="text-[12px] text-text-muted">{requirementCount(record)} requirements · source saved</span><Link href={dossierUrl(record.id)} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border-strong px-3 text-[12px] font-semibold text-text-primary hover:border-gold hover:text-gold">Open Dossier <ArrowUpRight aria-hidden="true" className="size-4" /></Link></div>
          </article>)}</div>}
      </section>
    </div>
  </AppShell>;
}
