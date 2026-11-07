"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle, Award, X } from "lucide-react";

import { createCertification, updateCertification } from "@/lib/api";
import { validateCertification } from "@/lib/certification-workspace";
import type { CertificationRecord, CertificationWritePayload } from "@/types/certification";

const inputClass = "mt-2 min-h-11 w-full min-w-0 rounded-md border border-border bg-surface-raised px-3 py-2.5 text-[14px] text-text-primary outline-none placeholder:text-text-muted focus-visible:border-gold disabled:opacity-50";
const labelClass = "block min-w-0 text-[12px] font-semibold text-text-secondary";

export function CertificationForm({ certification, onSaved, onCancel }: {
  certification?: CertificationRecord;
  onSaved: (record: CertificationRecord) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(certification?.name ?? "");
  const [issuer, setIssuer] = useState(certification?.issuer ?? "");
  const [credentialId, setCredentialId] = useState(certification?.credentialId ?? "");
  const [credentialUrl, setCredentialUrl] = useState(certification?.credentialUrl ?? "");
  const [issuedAt, setIssuedAt] = useState(certification?.issuedAt ?? "");
  const [expiresAt, setExpiresAt] = useState(certification?.expiresAt ?? "");
  const [description, setDescription] = useState(certification?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const payload: CertificationWritePayload = {
      name: name.trim(), issuer: issuer.trim(), credentialId: credentialId.trim() || null,
      credentialUrl: credentialUrl.trim() || null, issuedAt: issuedAt || null,
      expiresAt: expiresAt || null, description: description.trim() || null,
    };
    const problem = validateCertification(payload);
    if (problem) { setError(problem); return; }
    setSaving(true); setError(null);
    try {
      const saved = certification ? await updateCertification(certification.id, payload) : await createCertification(payload);
      onSaved(saved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save credential."); }
    finally { setSaving(false); }
  }

  return (
    <section aria-labelledby="certification-form-heading" className="rounded-xl border border-gold/50 bg-surface p-5 sm:p-7">
      <div className="flex items-start justify-between gap-4 border-b border-border-subtle pb-5">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold"><Award className="size-4" aria-hidden="true" />Credential record</p>
          <h2 id="certification-form-heading" className="mt-2 text-[21px] font-semibold text-text-primary">{certification ? "Edit certification" : "Add certification"}</h2>
          <p className="mt-2 max-w-xl text-[13px] leading-6 text-text-secondary">Record the credential as issued. You can link saved Skills and Evidence after saving.</p>
        </div>
        <button type="button" aria-label="Close certification form" disabled={saving} onClick={onCancel} className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border text-text-secondary hover:bg-surface-hover"><X className="size-4" aria-hidden="true" /></button>
      </div>
      {error && <p role="alert" className="mt-5 flex items-start gap-2 rounded-md border border-danger-border bg-danger-surface p-4 text-[13px] text-danger-text"><AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{error}</p>}
      <form onSubmit={(event) => void submit(event)} className="mt-6 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className={labelClass}>Certification name <span className="text-gold">*</span>
            <input autoFocus className={inputClass} required minLength={2} maxLength={160} placeholder="e.g. AWS Certified Security – Specialty" value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className={labelClass}>Issuing organization <span className="text-gold">*</span>
            <input className={inputClass} required minLength={2} maxLength={160} placeholder="e.g. Amazon Web Services" value={issuer} onChange={(event) => setIssuer(event.target.value)} />
          </label>
          <label className={labelClass}>Credential ID <span className="font-normal text-text-muted">(optional)</span>
            <input className={inputClass} maxLength={160} placeholder="Issuer-provided identifier" value={credentialId} onChange={(event) => setCredentialId(event.target.value)} />
          </label>
          <label className={labelClass}>Credential URL <span className="font-normal text-text-muted">(optional)</span>
            <input className={inputClass} type="url" placeholder="https://..." value={credentialUrl} onChange={(event) => setCredentialUrl(event.target.value)} />
          </label>
          <label className={labelClass}>Issue date <span className="font-normal text-text-muted">(optional)</span>
            <input className={inputClass} type="date" value={issuedAt} max={expiresAt || undefined} onChange={(event) => setIssuedAt(event.target.value)} />
          </label>
          <label className={labelClass}>Expiration date <span className="font-normal text-text-muted">(optional)</span>
            <input className={inputClass} type="date" min={issuedAt || undefined} value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
          </label>
        </div>
        <label className={labelClass}>Notes <span className="font-normal text-text-muted">(optional)</span>
          <textarea className={inputClass} rows={4} maxLength={2000} placeholder="Scope, specializations, or context you want to remember…" value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <p className="rounded-lg border border-border bg-surface-raised p-4 text-[12px] leading-5 text-text-secondary">Credentials and verification URLs are entered by you. The Continental does not contact issuers or verify credentials automatically.</p>
        <div className="flex flex-wrap gap-3 border-t border-border-subtle pt-5">
          <button type="submit" disabled={saving} className="inline-flex min-h-11 items-center rounded-md bg-gold px-5 text-[13px] font-semibold text-text-inverse hover:bg-gold-hover disabled:opacity-50">{saving ? "Saving…" : certification ? "Save changes" : "Save & open credential"}</button>
          <button type="button" disabled={saving} onClick={onCancel} className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-[13px] font-semibold text-text-secondary hover:bg-surface-hover disabled:opacity-50">Cancel</button>
        </div>
      </form>
    </section>
  );
}
