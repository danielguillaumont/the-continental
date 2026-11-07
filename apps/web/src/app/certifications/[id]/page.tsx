"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, ArrowUpRight, Award, ExternalLink, LibraryBig, Link2, Pencil, RefreshCw, Tags, Trash2 } from "lucide-react";

import { CertificationForm } from "@/components/certifications/certification-form";
import { AppShell } from "@/components/shell/app-shell";
import {
  attachCertificationEvidence, attachCertificationSkill, deleteCertification,
  detachCertificationEvidence, detachCertificationSkill, getCertification,
  listEvidence, listSkills,
} from "@/lib/api";
import { credentialStatus, credentialStatusLabels, formatCredentialDate } from "@/lib/certification-workspace";
import type { CertificationRecord } from "@/types/certification";
import type { EvidenceRecord } from "@/types/evidence";
import type { SkillSummary } from "@/types/skill";

const secondary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border bg-surface-raised px-3 text-[12px] font-semibold text-text-secondary hover:border-border-strong hover:bg-surface-hover hover:text-text-primary disabled:opacity-50";
const select = "min-h-11 w-full min-w-0 rounded-md border border-border bg-surface-raised px-3 text-[13px] text-text-primary outline-none focus-visible:border-gold disabled:opacity-50";
const chip = "rounded-md border border-border bg-surface-raised px-2.5 py-1.5 text-[12px] text-text-secondary";

export default function CertificationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [record, setRecord] = useState<CertificationRecord | null>(null);
  const [skills, setSkills] = useState<SkillSummary[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState("");
  const [selectedEvidence, setSelectedEvidence] = useState("");

  useEffect(() => {
    let active = true;
    void Promise.all([getCertification(id), listSkills(), listEvidence()])
      .then(([credential, skillItems, evidenceItems]) => {
        if (active) { setRecord(credential); setSkills(skillItems); setEvidence(evidenceItems); setLoadError(null); }
      })
      .catch((cause: unknown) => { if (active) setLoadError(cause instanceof Error ? cause.message : "Could not load this credential."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  async function refresh() {
    setBusy(true); setActionError(null);
    try {
      const [credential, skillItems, evidenceItems] = await Promise.all([getCertification(id), listSkills(), listEvidence()]);
      setRecord(credential); setSkills(skillItems); setEvidence(evidenceItems); setLoadError(null);
    } catch (cause) { setActionError(cause instanceof Error ? cause.message : "Could not refresh credential."); }
    finally { setBusy(false); }
  }

  async function runAction(action: () => Promise<CertificationRecord>, success: string) {
    if (busy || !record) return;
    setBusy(true); setActionError(null); setNotice(null);
    try { setRecord(await action()); setSelectedSkill(""); setSelectedEvidence(""); setNotice(success); }
    catch (cause) { setActionError(cause instanceof Error ? cause.message : "Could not update credential links."); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!record || busy) return;
    setBusy(true); setActionError(null);
    try { await deleteCertification(record.id); router.push("/certifications"); }
    catch (cause) { setActionError(cause instanceof Error ? cause.message : "Could not delete credential."); setConfirmDelete(false); setBusy(false); }
  }

  const availableSkills = skills.filter((item) => !record?.skills.some((linked) => linked.id === item.id));
  const availableEvidence = evidence.filter((item) => !record?.evidence.some((linked) => linked.id === item.id));
  const status = record ? credentialStatus(record.expiresAt) : null;

  return (
    <AppShell sectionLabel="Certifications">
      <div className="mx-auto w-full max-w-[1120px] px-4 py-7 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <Link href="/certifications" className="inline-flex min-h-10 items-center gap-2 text-[12px] font-semibold text-text-secondary hover:text-gold"><ArrowLeft className="size-4" aria-hidden="true" /> All certifications</Link>
        {loading ? <p role="status" className="mt-6 rounded-lg border border-border bg-surface p-7 text-text-secondary">Loading certification…</p> : loadError ?
          <div role="alert" className="mt-6 rounded-lg border border-danger-border bg-danger-surface p-5 text-[13px] text-danger-text">{loadError} <button type="button" className="underline" onClick={() => void refresh()}>Retry</button></div>
          : record ? <>
            <header className="mt-5 flex flex-wrap items-start justify-between gap-4 border-b border-border-subtle pb-7">
              <div className="min-w-0 max-w-[680px]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">Certifications / credential record</p>
                <h1 className="mt-2 break-words text-[27px] font-semibold tracking-tight sm:text-[32px]">{record.name}</h1>
                <p className="mt-2 text-[15px] text-gold">{record.issuer}</p>
                {status && <p className="mt-4 inline-flex rounded-md border border-border bg-surface-raised px-3 py-2 text-[12px] text-text-secondary">{credentialStatusLabels[status]} · based on saved dates</p>}
              </div>
              <button type="button" className={secondary} onClick={() => setEditing((value) => !value)}><Pencil className="size-4" aria-hidden="true" />{editing ? "Close editor" : "Edit certification"}</button>
            </header>

            {notice && <p role="status" className="mt-5 rounded-md border border-success-border bg-success-surface p-4 text-[13px] text-success-text">{notice}</p>}
            {actionError && <p role="alert" className="mt-5 flex gap-2 rounded-md border border-danger-border bg-danger-surface p-4 text-[13px] text-danger-text"><AlertCircle aria-hidden="true" className="size-4 shrink-0" />{actionError}</p>}
            {editing && <div className="mt-6"><CertificationForm key={`${record.id}-${record.updatedAt}`} certification={record} onCancel={() => setEditing(false)} onSaved={(saved) => { setRecord(saved); setEditing(false); setNotice("Credential details saved."); }} /></div>}

            <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="min-w-0 space-y-5">
                <section aria-labelledby="credential-details" className="rounded-xl border border-border bg-surface p-5 sm:p-6">
                  <div className="flex items-center gap-2"><Award className="size-4 text-gold" aria-hidden="true" /><h2 id="credential-details" className="text-[17px] font-semibold">Credential details</h2></div>
                  <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div><dt className="text-[11px] uppercase tracking-wider text-text-muted">Issued</dt><dd className="mt-1 text-[13px] text-text-primary">{formatCredentialDate(record.issuedAt)}</dd></div>
                    <div><dt className="text-[11px] uppercase tracking-wider text-text-muted">Expires</dt><dd className="mt-1 text-[13px] text-text-primary">{formatCredentialDate(record.expiresAt)}</dd></div>
                    <div><dt className="text-[11px] uppercase tracking-wider text-text-muted">Credential ID</dt><dd className="mt-1 break-all text-[13px] text-text-primary">{record.credentialId ?? "Not recorded"}</dd></div>
                    <div><dt className="text-[11px] uppercase tracking-wider text-text-muted">Credential URL</dt><dd className="mt-1 break-all text-[13px]">{record.credentialUrl ? <a href={record.credentialUrl} rel="noopener noreferrer" target="_blank" className="inline-flex items-center gap-1 text-gold hover:underline">Open provided link <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" /></a> : <span className="text-text-muted">Not recorded</span>}</dd></div>
                  </dl>
                  {record.description && <p className="mt-5 whitespace-pre-wrap break-words border-t border-border-subtle pt-5 text-[13px] leading-6 text-text-secondary">{record.description}</p>}
                  <p className="mt-5 border-t border-border-subtle pt-4 text-[12px] leading-5 text-text-muted">This is an owner-entered credential record. Dates and links are not independently validated with the issuer.</p>
                </section>

                <section aria-labelledby="credential-skills" className="rounded-xl border border-border bg-surface p-5 sm:p-6">
                  <div className="flex items-center gap-2"><Tags className="size-4 text-gold" aria-hidden="true" /><h2 id="credential-skills" className="text-[17px] font-semibold">Related skills</h2></div>
                  <p className="mt-2 text-[12px] text-text-secondary">Link relevant skills already present in your evidence-driven inventory.</p>
                  {record.skills.length === 0 ? <p className="mt-4 rounded-lg border border-dashed border-border p-5 text-[13px] text-text-muted">No skills linked yet.</p> : <ul className="mt-4 space-y-2">{record.skills.map((skill) => <li key={skill.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-raised p-3"><Link href={`/skills/${encodeURIComponent(skill.id)}`} className="inline-flex items-center gap-1 break-words text-[13px] font-semibold hover:text-gold">{skill.name}<ArrowUpRight aria-hidden="true" className="size-4 shrink-0" /></Link><button type="button" disabled={busy} className={secondary} onClick={() => void runAction(() => detachCertificationSkill(id, skill.id), "Skill link removed; the skill remains saved.")}>Detach</button></li>)}</ul>}
                  <div className="mt-5 grid gap-2 sm:grid-cols-[minmax(0,1fr)_100px]"><label><span className="mb-2 block text-[11px] text-text-secondary">Choose an unlinked skill</span><select className={select} value={selectedSkill} onChange={(event) => setSelectedSkill(event.target.value)} disabled={busy || availableSkills.length === 0}><option value="">{availableSkills.length ? "Select skill…" : "No unlinked skills available"}</option>{availableSkills.map((skill) => <option key={skill.id} value={skill.id}>{skill.name}</option>)}</select></label><button type="button" disabled={busy || !selectedSkill} className="mt-auto min-h-11 rounded-md bg-gold px-4 text-[12px] font-semibold text-text-inverse disabled:opacity-50" onClick={() => void runAction(() => attachCertificationSkill(id, selectedSkill), "Skill linked to credential.")}>Link skill</button></div>
                  <Link href="/skills" className="mt-4 inline-flex min-h-9 items-center text-[12px] font-semibold text-text-secondary hover:text-gold">Browse skills <ArrowUpRight className="ml-1 size-4" aria-hidden="true" /></Link>
                </section>

                <section aria-labelledby="credential-evidence" className="rounded-xl border border-border bg-surface p-5 sm:p-6">
                  <div className="flex items-center gap-2"><LibraryBig className="size-4 text-gold" aria-hidden="true" /><h2 id="credential-evidence" className="text-[17px] font-semibold">Supporting evidence</h2></div>
                  <p className="mt-2 text-[12px] text-text-secondary">Reuse existing proof records without duplicating or transferring ownership.</p>
                  {record.evidence.length === 0 ? <p className="mt-4 rounded-lg border border-dashed border-border p-5 text-[13px] text-text-muted">No supporting evidence linked yet.</p> : <ul className="mt-4 space-y-2">{record.evidence.map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-raised p-3"><div className="min-w-0"><Link href={`/armory/${encodeURIComponent(item.id)}`} className="inline-flex items-center gap-1 break-words text-[13px] font-semibold hover:text-gold">{item.title}<ArrowUpRight aria-hidden="true" className="size-4 shrink-0" /></Link><p className="mt-1 text-[11px] text-text-muted">{item.kind} · {item.status === "verified" ? "Marked verified by owner" : "Unverified"}</p></div><button type="button" disabled={busy} className={secondary} onClick={() => void runAction(() => detachCertificationEvidence(id, item.id), "Evidence link removed; the original record remains saved.")}>Detach</button></li>)}</ul>}
                  <div className="mt-5 grid gap-2 sm:grid-cols-[minmax(0,1fr)_110px]"><label><span className="mb-2 block text-[11px] text-text-secondary">Choose unlinked evidence</span><select className={select} value={selectedEvidence} onChange={(event) => setSelectedEvidence(event.target.value)} disabled={busy || availableEvidence.length === 0}><option value="">{availableEvidence.length ? "Select evidence…" : "No unlinked evidence available"}</option>{availableEvidence.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><button type="button" disabled={busy || !selectedEvidence} className="mt-auto min-h-11 rounded-md bg-gold px-4 text-[12px] font-semibold text-text-inverse disabled:opacity-50" onClick={() => void runAction(() => attachCertificationEvidence(id, selectedEvidence), "Evidence linked to credential.")}>Link evidence</button></div>
                  <Link href="/armory" className="mt-4 inline-flex min-h-9 items-center text-[12px] font-semibold text-text-secondary hover:text-gold">Browse evidence <ArrowUpRight className="ml-1 size-4" aria-hidden="true" /></Link>
                </section>
              </div>
              <aside className="min-w-0 space-y-4">
                <div className="rounded-xl border border-border bg-surface p-5"><p className="text-[11px] font-semibold uppercase tracking-wider text-gold">At a glance</p><div className="mt-5 flex flex-wrap gap-2"><span className={chip}>{record.skills.length} skills</span><span className={chip}>{record.evidence.length} proof records</span></div><p className="mt-4 text-[12px] text-text-muted">Added {formatCredentialDate(record.createdAt.slice(0, 10))}</p><button type="button" disabled={busy} className={`mt-5 ${secondary}`} onClick={() => void refresh()}><RefreshCw className="size-4" aria-hidden="true" />Refresh</button></div>
                <div className="rounded-xl border border-danger-border/50 bg-surface p-5"><p className="text-[13px] font-semibold">Credential management</p><p className="mt-2 text-[12px] leading-5 text-text-secondary">Deleting this credential removes only its links, not existing skills or evidence.</p>{confirmDelete ? <div className="mt-4"><p className="text-[12px] font-semibold text-danger-text">Permanently delete this credential?</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={() => void remove()} className="min-h-10 rounded-md border border-danger-border bg-danger-surface px-3 text-[12px] font-semibold text-danger-text disabled:opacity-50">{busy ? "Deleting…" : "Confirm delete"}</button><button type="button" disabled={busy} onClick={() => setConfirmDelete(false)} className={secondary}>Cancel</button></div></div> : <button type="button" onClick={() => setConfirmDelete(true)} className="mt-4 inline-flex min-h-10 items-center gap-2 text-[12px] font-semibold text-danger-text hover:underline"><Trash2 aria-hidden="true" className="size-4" /> Delete certification</button>}</div>
                <p className="flex items-start gap-2 text-[12px] leading-5 text-text-muted"><Link2 className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />Credential links are informational. No issuer verification or automatic renewal checks are performed.</p>
              </aside>
            </div>
          </> : null}
      </div>
    </AppShell>
  );
}
