"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  AlertCircle, ArrowUpRight, CalendarDays, CheckCircle2, Globe, GitBranch,
  Link2, Mail, MapPin, Pencil, RefreshCw, Save, ShieldAlert, UserRound, X, type LucideIcon,
} from "lucide-react";

import { AppShell } from "@/components/shell/app-shell";
import { getProfile, saveProfile } from "@/lib/api";
import {
  draftFromProfile, formatProfileDate, profilePayload, safeExternalUrl, validateProfile,
  type ProfileDraft,
} from "@/lib/profile-workspace";
import type { ProfileRecord } from "@/types/profile";

const field = "mt-2 min-h-11 w-full min-w-0 rounded-md border border-border bg-surface-raised px-3 py-2.5 text-[14px] text-text-primary outline-none placeholder:text-text-muted focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/20 disabled:opacity-50";
const label = "block min-w-0 text-[12px] font-semibold text-text-secondary";

function ProfileEditor({ initial, onSaved, onCancel }: {
  initial: ProfileRecord | null;
  onSaved: (saved: ProfileRecord) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<ProfileDraft>(() => draftFromProfile(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function change<K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const payload = profilePayload(draft);
    const validation = validateProfile(payload);
    if (validation) { setError(validation); return; }
    setSaving(true);
    setError(null);
    try { onSaved(await saveProfile(payload)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save the profile."); }
    finally { setSaving(false); }
  }

  return (
    <section aria-labelledby="profile-editor-heading" className="rounded-xl border border-gold/40 bg-surface p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">Professional identity</p>
          <h2 id="profile-editor-heading" className="mt-2 text-[22px] font-semibold">{initial ? "Edit your profile" : "Create your profile"}</h2>
          <p className="mt-2 max-w-2xl text-[13px] leading-6 text-text-secondary">Start with your name. Other details are optional and can be updated later.</p>
        </div>
        <button type="button" disabled={saving} onClick={onCancel} aria-label="Close profile editor" className="inline-flex size-10 items-center justify-center rounded-md border border-border hover:bg-surface-hover disabled:opacity-50"><X className="size-4" aria-hidden="true" /></button>
      </div>
      {error && <p role="alert" className="mt-5 flex items-start gap-2 rounded-md border border-danger-border bg-danger-surface p-4 text-[13px] text-danger-text"><AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />{error}</p>}
      <form onSubmit={(event) => void submit(event)} className="mt-6 space-y-7">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className={label}>Full name <span className="text-gold">*</span>
            <input className={field} autoFocus required minLength={2} maxLength={160} autoComplete="name" placeholder="Your full name" value={draft.fullName} onChange={(event) => change("fullName", event.target.value)} />
          </label>
          <label className={label}>Location <span className="font-normal text-text-muted">(optional)</span>
            <input className={field} maxLength={160} autoComplete="address-level2" placeholder="City, region or remote" value={draft.location} onChange={(event) => change("location", event.target.value)} />
          </label>
        </div>
        <label className={label}>Professional headline <span className="font-normal text-text-muted">(optional)</span>
          <input className={field} maxLength={200} placeholder="What kind of work do you do?" value={draft.headline} onChange={(event) => change("headline", event.target.value)} />
          <span className="mt-1 block text-[11px] font-normal text-text-muted">Up to 200 characters.</span>
        </label>
        <label className={label}>Professional summary <span className="font-normal text-text-muted">(optional)</span>
          <textarea className={field} rows={6} maxLength={4000} placeholder="Describe your experience, strengths and the work you want to do." value={draft.professionalSummary} onChange={(event) => change("professionalSummary", event.target.value)} />
          <span className="mt-1 block text-[11px] font-normal text-text-muted">{draft.professionalSummary.length.toLocaleString()} / 4,000 characters.</span>
        </label>
        <div className="border-t border-border-subtle pt-6">
          <h3 className="text-[15px] font-semibold">Career direction</h3>
          <p className="mt-1 text-[12px] text-text-secondary">Keep targets separate from the experience you have already recorded.</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className={label}>Target roles <span className="font-normal text-text-muted">(optional)</span>
              <textarea className={field} rows={5} placeholder={"Security Engineer\nCloud Engineer\nSystems Administrator"} value={draft.targetRolesText} onChange={(event) => change("targetRolesText", event.target.value)} />
              <span className="mt-1 block text-[11px] font-normal text-text-muted">One target role per line; up to 12 distinct roles, 120 characters each.</span>
            </label>
            <label className={label}>Available from <span className="font-normal text-text-muted">(optional)</span>
              <input className={field} type="date" value={draft.availableFrom} onChange={(event) => change("availableFrom", event.target.value)} />
              <span className="mt-1 block text-[11px] font-normal text-text-muted">Leave blank if you do not want to record a start date.</span>
            </label>
          </div>
        </div>
        <div className="border-t border-border-subtle pt-6">
          <h3 className="text-[15px] font-semibold">Contact and portfolio</h3>
          <p className="mt-1 text-[12px] leading-5 text-text-secondary">Stored locally in the current development database. Do not expose this API publicly without authentication.</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className={label}>Email <span className="font-normal text-text-muted">(optional)</span>
              <input className={field} type="email" autoComplete="email" maxLength={254} placeholder="you@example.com" value={draft.email} onChange={(event) => change("email", event.target.value)} />
            </label>
            <label className={label}>Phone <span className="font-normal text-text-muted">(optional)</span>
              <input className={field} type="tel" autoComplete="tel" maxLength={40} placeholder="Contact number" value={draft.phone} onChange={(event) => change("phone", event.target.value)} />
            </label>
            <label className={label}>Portfolio website <span className="font-normal text-text-muted">(optional)</span>
              <input className={field} type="url" placeholder="https://example.com" value={draft.websiteUrl} onChange={(event) => change("websiteUrl", event.target.value)} />
            </label>
            <label className={label}>GitHub <span className="font-normal text-text-muted">(optional)</span>
              <input className={field} type="url" placeholder="https://github.com/username" value={draft.githubUrl} onChange={(event) => change("githubUrl", event.target.value)} />
            </label>
            <label className={label}>LinkedIn <span className="font-normal text-text-muted">(optional)</span>
              <input className={field} type="url" placeholder="https://linkedin.com/in/username" value={draft.linkedinUrl} onChange={(event) => change("linkedinUrl", event.target.value)} />
            </label>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-border-subtle pt-5">
          <button type="submit" disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-gold px-5 text-[13px] font-semibold text-text-inverse hover:bg-gold-hover disabled:opacity-50"><Save aria-hidden="true" className="size-4" />{saving ? "Saving…" : initial ? "Save profile" : "Create profile"}</button>
          <button type="button" disabled={saving} onClick={onCancel} className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-[13px] font-semibold hover:bg-surface-hover disabled:opacity-50">Cancel</button>
        </div>
      </form>
    </section>
  );
}

function LinkCard({ label, url, Icon }: { label: string; url: string | null; Icon: LucideIcon }) {
  const safeUrl = safeExternalUrl(url);
  if (!safeUrl) return null;
  return <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-border bg-surface-raised px-4 text-[13px] hover:border-gold"><span className="flex min-w-0 items-center gap-2"><Icon aria-hidden="true" className="size-4 shrink-0 text-gold" /><span>{label}</span></span><ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-text-muted" /></a>;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getProfile().then((value) => { if (active) { setProfile(value); setError(null); } })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load profile."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function refresh() {
    setRefreshing(true);
    setNotice(null);
    try { setProfile(await getProfile()); setError(null); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not refresh profile."); }
    finally { setRefreshing(false); }
  }

  function saved(record: ProfileRecord) {
    setProfile(record);
    setEditing(false);
    setError(null);
    setNotice("Profile saved. Your career record now has a professional identity.");
  }

  return <AppShell sectionLabel="Profile">
    <div className="mx-auto w-full max-w-[1160px] px-4 py-7 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <header className="flex flex-wrap items-start justify-between gap-5 border-b border-border-subtle pb-7">
        <div className="max-w-[700px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">Workspace / Profile</p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-tight sm:text-[32px]">Your professional identity.</h1>
          <p className="mt-3 text-[14px] leading-6 text-text-secondary">Keep your professional introduction, career direction, and portfolio links in one persistent record. Your work and proof live in the other workspaces.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void refresh()} disabled={loading || refreshing || editing} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-surface px-4 text-[13px] hover:bg-surface-hover disabled:opacity-50"><RefreshCw aria-hidden="true" className={`size-4 ${refreshing ? "animate-spin" : ""}`} />Refresh</button>
          {profile && !editing && <button type="button" onClick={() => { setEditing(true); setNotice(null); }} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-gold px-5 text-[13px] font-semibold text-text-inverse hover:bg-gold-hover"><Pencil aria-hidden="true" className="size-4" />Edit profile</button>}
        </div>
      </header>
      <div className="mt-5 flex items-start gap-3 rounded-lg border border-warning-border/60 bg-warning-surface/40 p-4 text-[12px] leading-5 text-warning-text"><ShieldAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" /><p><strong>Local development only.</strong> Profile details may include personal contact information. This v0.1 app has no authentication or tenant isolation; do not publish the API or its database.</p></div>
      {notice && !editing && <p role="status" className="mt-5 flex items-center gap-2 rounded-lg border border-success-border bg-success-surface p-4 text-[13px] text-success-text"><CheckCircle2 aria-hidden="true" className="size-4" />{notice}</p>}
      {error && !editing && <p role="alert" className="mt-5 flex flex-wrap items-center gap-2 rounded-lg border border-danger-border bg-danger-surface p-4 text-[13px] text-danger-text"><AlertCircle className="size-4" aria-hidden="true" />{error}<button type="button" className="ml-2 font-semibold underline" onClick={() => void refresh()}>Retry</button></p>}
      {loading ? <div role="status" className="mt-7 rounded-xl border border-border bg-surface p-8 text-[13px] text-text-secondary">Loading your profile…</div>
        : error && !editing ? null
        : editing ? <div className="mt-7"><ProfileEditor initial={profile} onSaved={saved} onCancel={() => { setEditing(false); setNotice(null); }} /></div>
        : !profile ? <section className="mt-7 rounded-xl border border-border bg-surface px-5 py-12 text-center"><UserRound aria-hidden="true" className="mx-auto size-10 text-gold" /><h2 className="mt-4 text-[21px] font-semibold">Start with your professional identity.</h2><p className="mx-auto mt-3 max-w-xl text-[13px] leading-6 text-text-secondary">Your profile has not been set up. Add your name now, then build out your story, career targets, and portfolio links whenever you are ready.</p><button type="button" onClick={() => setEditing(true)} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md bg-gold px-5 text-[13px] font-semibold text-text-inverse hover:bg-gold-hover"><UserRound aria-hidden="true" className="size-4" />Create profile</button></section>
        : <div className="mt-7 grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="min-w-0 space-y-5">
            <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
              <div className="flex items-start gap-4"><div className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-gold/35 bg-gold-surface"><UserRound aria-hidden="true" className="size-6 text-gold" /></div><div className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold">Career profile</p><h2 className="mt-1 break-words text-[25px] font-semibold leading-tight sm:text-[30px]">{profile.fullName}</h2>{profile.headline && <p className="mt-2 break-words text-[15px] text-text-secondary">{profile.headline}</p>}</div></div>
              {profile.professionalSummary ? <div className="mt-7 border-t border-border-subtle pt-6"><h3 className="text-[13px] font-semibold">About</h3><p className="mt-3 whitespace-pre-wrap break-words text-[14px] leading-7 text-text-secondary">{profile.professionalSummary}</p></div> : <p className="mt-6 border-t border-border-subtle pt-5 text-[13px] text-text-muted">Add a professional summary to give your experience context.</p>}
            </div>
            <div className="rounded-xl border border-border bg-surface p-6 sm:p-7"><h3 className="text-[16px] font-semibold">Career direction</h3><p className="mt-1 text-[12px] text-text-secondary">Roles you are interested in pursuing.</p>{profile.targetRoles.length ? <ul className="mt-5 flex flex-wrap gap-2">{profile.targetRoles.map((role) => <li key={role} className="max-w-full break-words rounded-md border border-border-strong bg-surface-raised px-3 py-2 text-[12px]">{role}</li>)}</ul> : <p className="mt-4 text-[13px] text-text-muted">No target roles recorded yet.</p>}</div>
          </section>
          <aside className="min-w-0 space-y-5">
            <section className="rounded-xl border border-border bg-surface p-5"><h3 className="text-[14px] font-semibold">At a glance</h3><div className="mt-4 space-y-4 text-[13px]"><div className="flex items-start gap-2"><MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-gold" /><span className="break-words text-text-secondary">{profile.location || "No location recorded"}</span></div><div className="flex items-start gap-2"><CalendarDays aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-gold" /><span className="break-words text-text-secondary">{profile.availableFrom ? `Available from ${formatProfileDate(profile.availableFrom) ?? profile.availableFrom}` : "Availability not recorded"}</span></div></div></section>
            <section className="rounded-xl border border-border bg-surface p-5"><h3 className="text-[14px] font-semibold">Contact & links</h3><div className="mt-4 space-y-2">{profile.email && <a className="flex min-h-11 items-center gap-2 break-all rounded-lg border border-border bg-surface-raised px-3 text-[12px] hover:border-gold" href={`mailto:${encodeURIComponent(profile.email)}`}><Mail aria-hidden="true" className="size-4 shrink-0 text-gold" />{profile.email}</a>}{profile.phone && <p className="break-words rounded-lg border border-border bg-surface-raised px-3 py-3 text-[12px] text-text-secondary">{profile.phone}</p>}<LinkCard label="Portfolio website" url={profile.websiteUrl} Icon={Globe} /><LinkCard label="GitHub" url={profile.githubUrl} Icon={GitBranch} /><LinkCard label="LinkedIn" url={profile.linkedinUrl} Icon={Link2} />{!profile.email && !profile.phone && !profile.websiteUrl && !profile.githubUrl && !profile.linkedinUrl && <p className="text-[13px] text-text-muted">No contact details recorded.</p>}</div></section>
            <p className="px-1 text-[11px] leading-5 text-text-muted">Saved {new Date(profile.updatedAt).toLocaleString("en-CA")}. These details are owner-entered, not independently verified.</p>
          </aside>
        </div>}
    </div>
  </AppShell>;
}
