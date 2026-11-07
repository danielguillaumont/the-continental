"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, Award, CalendarClock, Plus, RefreshCw, Search } from "lucide-react";

import { CertificationForm } from "@/components/certifications/certification-form";
import { AppShell } from "@/components/shell/app-shell";
import { listCertifications } from "@/lib/api";
import { credentialStatus, credentialStatusLabels, credentialUrl, filterCertifications, formatCredentialDate, type CredentialStatus } from "@/lib/certification-workspace";
import type { CertificationRecord } from "@/types/certification";

const statusStyles: Record<CredentialStatus, string> = {
  expired: "bg-danger-surface text-danger-text",
  expiring: "bg-warning-surface text-warning-text",
  active: "bg-success-surface text-success-text",
  "no-expiration": "bg-neutral-status-surface text-neutral-status-text",
};

export default function CertificationsPage() {
  const router = useRouter();
  const [records, setRecords] = useState<CertificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<CredentialStatus | "all">("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void listCertifications().then((items) => { if (active) { setRecords(items); setError(null); } })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load certifications."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function refresh() {
    setRefreshing(true);
    try { setRecords(await listCertifications()); setError(null); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not refresh certifications."); }
    finally { setRefreshing(false); }
  }

  const filtered = filterCertifications(records, query, status);
  const expiredCount = records.filter((record) => credentialStatus(record.expiresAt) === "expired").length;
  const expiringCount = records.filter((record) => credentialStatus(record.expiresAt) === "expiring").length;

  return (
    <AppShell sectionLabel="Certifications">
      <div className="mx-auto w-full max-w-[1160px] px-4 py-7 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <header className="flex flex-wrap items-start justify-between gap-5 border-b border-border-subtle pb-7">
          <div className="max-w-[690px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">Your career record / Certifications</p>
            <h1 className="mt-2 text-[28px] font-semibold leading-tight tracking-tight text-text-primary sm:text-[32px]">Credentials, with context.</h1>
            <p className="mt-3 text-[14px] leading-6 text-text-secondary">Record earned credentials, keep track of dates, and connect them to the skills and evidence you already have.</p>
          </div>
          <button type="button" onClick={() => setCreating((old) => !old)} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-gold px-5 text-[13px] font-semibold text-text-inverse hover:bg-gold-hover"><Plus aria-hidden="true" className="size-4" />Add certification</button>
        </header>
        {creating && <div className="mt-6"><CertificationForm onCancel={() => setCreating(false)} onSaved={(item) => router.push(credentialUrl(item.id))} /></div>}
        {error && <p role="alert" className="mt-6 rounded-lg border border-danger-border bg-danger-surface p-4 text-[13px] text-danger-text">{error} <button onClick={() => void refresh()} type="button" className="ml-2 font-semibold underline">Retry</button></p>}
        {!loading && !error && <section aria-label="Certification summary" className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface p-5"><Award className="size-5 text-gold" aria-hidden="true" /><p className="mt-3 text-[12px] text-text-secondary">Credentials recorded</p><p className="mt-1 text-[28px] font-semibold">{records.length}</p></div>
          <div className="rounded-xl border border-border bg-surface p-5"><CalendarClock className="size-5 text-gold" aria-hidden="true" /><p className="mt-3 text-[12px] text-text-secondary">Expiring within 30 days</p><p className="mt-1 text-[28px] font-semibold">{expiringCount}</p></div>
          <div className="rounded-xl border border-border bg-surface p-5"><CalendarClock className="size-5 text-gold" aria-hidden="true" /><p className="mt-3 text-[12px] text-text-secondary">Expired</p><p className="mt-1 text-[28px] font-semibold">{expiredCount}</p></div>
        </section>}
        <section aria-labelledby="certifications-heading" className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 id="certifications-heading" className="text-[18px] font-semibold">Certification registry</h2><p className="mt-1 text-[13px] text-text-secondary">Dates and status come from saved records, not issuer verification.</p></div>
            <button type="button" disabled={loading || refreshing} onClick={() => void refresh()} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-surface-raised px-4 text-[13px] hover:bg-surface-hover disabled:opacity-50"><RefreshCw aria-hidden="true" className={`size-4 ${refreshing ? "animate-spin" : ""}`} />Refresh</button>
          </div>
          {records.length > 0 && !error && <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_240px]">
            <label className="flex min-w-0 items-center gap-3 rounded-md border border-border bg-surface-raised px-3 focus-within:border-gold"><Search aria-hidden="true" className="size-4 shrink-0 text-text-muted" /><span className="sr-only">Search certifications</span><input type="search" placeholder="Search name, issuer, credential ID…" value={query} onChange={(event) => setQuery(event.target.value)} className="min-h-11 w-full min-w-0 bg-transparent text-[13px] outline-none placeholder:text-text-muted" /></label>
            <label className="min-w-0"><span className="sr-only">Filter expiration status</span><select className="min-h-11 w-full rounded-md border border-border bg-surface-raised px-3 text-[13px]" value={status} onChange={(event) => setStatus(event.target.value as CredentialStatus | "all")}><option value="all">All expiration statuses</option><option value="active">Not expired</option><option value="expiring">Expiring soon</option><option value="expired">Expired</option><option value="no-expiration">No expiration recorded</option></select></label>
          </div>}
          {loading ? <p role="status" className="mt-5 rounded-lg border border-border bg-surface p-7 text-text-secondary">Loading credentials…</p> : error ? null : records.length === 0 ?
            <div className="mt-5 rounded-xl border border-border bg-surface px-5 py-12 text-center"><Award className="mx-auto size-9 text-gold" aria-hidden="true" /><h3 className="mt-4 text-[19px] font-semibold">Start with a credential you earned.</h3><p className="mx-auto mt-2 max-w-lg text-[13px] leading-6 text-text-secondary">Save the issuer and important dates. Link skills and proof after creating your record.</p><button type="button" onClick={() => setCreating(true)} className="mt-5 inline-flex min-h-11 items-center rounded-md bg-gold px-5 text-[13px] font-semibold text-text-inverse">Add your first certification</button></div>
            : filtered.length === 0 ? <p className="mt-5 rounded-lg border border-border bg-surface p-6 text-[13px] text-text-secondary">No certifications match these filters.</p>
            : <ul className="mt-5 grid gap-4 md:grid-cols-2" aria-label="Saved certifications">{filtered.map((item) => {
              const currentStatus = credentialStatus(item.expiresAt);
              return <li key={item.id} className="flex min-w-0 flex-col rounded-xl border border-border bg-surface p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2"><Award aria-hidden="true" className="size-5 text-gold" /><span className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold ${statusStyles[currentStatus]}`}>{credentialStatusLabels[currentStatus]}</span></div>
                <h3 className="mt-4 break-words text-[18px] font-semibold">{item.name}</h3><p className="mt-1 break-words text-[13px] text-gold">{item.issuer}</p>
                <p className="mt-3 text-[12px] text-text-muted">Issued {formatCredentialDate(item.issuedAt)} · Expires {formatCredentialDate(item.expiresAt)}</p>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-5 sm:mt-5"><span className="text-[12px] text-text-muted">{item.skills.length} skills · {item.evidence.length} proof records</span><Link href={credentialUrl(item.id)} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border-strong px-3 text-[12px] font-semibold hover:text-gold">Open credential <ArrowUpRight className="size-4" aria-hidden="true" /></Link></div>
              </li>;
            })}</ul>}
          <p className="mt-6 text-[12px] leading-5 text-text-muted">Credential details and verification links are entered by the owner. An unexpired credential is not automatically issuer-verified.</p>
        </section>
      </div>
    </AppShell>
  );
}
