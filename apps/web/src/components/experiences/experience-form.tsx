"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle, BriefcaseBusiness, X } from "lucide-react";

import { createExperience, updateExperience } from "@/lib/api";
import { employmentLabels, parseHighlights, validateExperience } from "@/lib/experience-workspace";
import type { EmploymentType, ExperienceRecord, ExperienceWritePayload } from "@/types/experience";

const field = "mt-2 w-full min-w-0 rounded-md border border-border bg-surface-raised px-3 py-3 text-[14px] text-text-primary outline-none placeholder:text-text-muted focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/30 disabled:opacity-50";
const caption = "block min-w-0 text-[12px] font-semibold text-text-secondary";
const employmentTypes = Object.keys(employmentLabels) as EmploymentType[];

type Draft = {
  organization: string;
  title: string;
  employmentType: EmploymentType | "";
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  highlightsText: string;
};

export function ExperienceForm({
  experience, onSaved, onCancel,
}: {
  experience?: ExperienceRecord;
  onSaved: (record: ExperienceRecord) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Draft>({
    organization: experience?.organization ?? "",
    title: experience?.title ?? "",
    employmentType: experience?.employmentType ?? "",
    location: experience?.location ?? "",
    startDate: experience?.startDate ?? "",
    endDate: experience?.endDate ?? "",
    current: experience?.endDate === null || !experience,
    description: experience?.description ?? "",
    highlightsText: experience?.highlights.join("\n") ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const payload: ExperienceWritePayload = {
      organization: draft.organization.trim(),
      title: draft.title.trim(),
      employmentType: draft.employmentType || null,
      location: draft.location.trim() || null,
      startDate: draft.startDate,
      endDate: draft.current ? null : draft.endDate || null,
      description: draft.description.trim(),
      highlights: parseHighlights(draft.highlightsText),
    };
    const validationError = validateExperience(payload);
    if (validationError) { setError(validationError); return; }

    setSaving(true);
    setError(null);
    try {
      const saved = experience
        ? await updateExperience(experience.id, payload)
        : await createExperience(payload);
      onSaved(saved);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save this experience.");
    } finally { setSaving(false); }
  }

  return (
    <section aria-labelledby="experience-form-heading" className="rounded-xl border border-gold/50 bg-surface p-5 sm:p-7">
      <div className="flex items-start justify-between gap-4 border-b border-border-subtle pb-5">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold"><BriefcaseBusiness className="size-4" aria-hidden="true" />Role details</p>
          <h2 id="experience-form-heading" className="mt-2 text-[21px] font-semibold text-text-primary">{experience ? "Edit experience" : "Add professional experience"}</h2>
          <p className="mt-2 max-w-xl text-[13px] leading-6 text-text-secondary">Describe the actual role and outcomes. Attach projects and proof from its workspace after saving.</p>
        </div>
        <button type="button" aria-label="Close experience form" disabled={saving} onClick={onCancel} className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border text-text-secondary hover:bg-surface-hover disabled:opacity-50"><X className="size-4" aria-hidden="true" /></button>
      </div>

      {error && <p role="alert" className="mt-5 flex items-start gap-2 rounded-md border border-danger-border bg-danger-surface p-4 text-[13px] text-danger-text"><AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{error}</p>}

      <form className="mt-6 space-y-6" onSubmit={(event) => void submit(event)}>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className={caption}>Employer or organization <span className="text-gold">*</span>
            <input className={field} autoFocus required maxLength={160} placeholder="e.g. Security team / Company" value={draft.organization} onChange={(event) => setDraft({ ...draft, organization: event.target.value })} />
          </label>
          <label className={caption}>Position or role <span className="text-gold">*</span>
            <input className={field} required maxLength={160} placeholder="e.g. Systems Administrator" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
          </label>
          <label className={caption}>Employment type
            <select className={field} value={draft.employmentType} onChange={(event) => setDraft({ ...draft, employmentType: event.target.value as EmploymentType | "" })}>
              <option value="">Not specified</option>
              {employmentTypes.map((type) => <option value={type} key={type}>{employmentLabels[type]}</option>)}
            </select>
          </label>
          <label className={caption}>Location <span className="font-normal text-text-muted">(optional)</span>
            <input className={field} maxLength={160} placeholder="e.g. Vancouver, BC · Remote" value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} />
          </label>
        </div>

        <div className="rounded-lg border border-border-subtle bg-surface-raised p-4 sm:p-5">
          <p className="mb-4 text-[13px] font-semibold text-text-primary">Time in role</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={caption}>Start date <span className="text-gold">*</span>
              <input className={field} type="date" required value={draft.startDate} onChange={(event) => setDraft({ ...draft, startDate: event.target.value })} />
            </label>
            <label className={caption}>End date <span className="font-normal text-text-muted">(optional)</span>
              <input className={field} type="date" disabled={draft.current} min={draft.startDate || undefined} value={draft.current ? "" : draft.endDate} onChange={(event) => setDraft({ ...draft, endDate: event.target.value })} />
            </label>
          </div>
          <label className="mt-4 flex min-h-10 cursor-pointer items-center gap-3 text-[13px] text-text-secondary">
            <input type="checkbox" className="size-4 accent-gold" checked={draft.current} onChange={(event) => setDraft({ ...draft, current: event.target.checked })} />I currently hold this role
          </label>
        </div>

        <label className={caption}>What did you do? <span className="text-gold">*</span>
          <textarea className={field} required minLength={10} maxLength={3000} rows={5} placeholder="Describe your responsibilities, the systems you worked with, and the outcomes of your work." value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
          <span className="mt-1 block text-[12px] font-normal text-text-muted">10–3,000 characters. Describe work you can stand behind.</span>
        </label>

        <label className={caption}>Key accomplishments <span className="font-normal text-text-muted">(optional)</span>
          <textarea className={field} rows={5} placeholder={"Automated a recurring security report…\nReduced manual system checks…"} value={draft.highlightsText} onChange={(event) => setDraft({ ...draft, highlightsText: event.target.value })} />
          <span className="mt-1 block text-[12px] font-normal text-text-muted">One accomplishment per line, up to 12. Each entry must be 3–300 characters.</span>
        </label>

        <div className="flex flex-wrap items-center gap-3 border-t border-border-subtle pt-5">
          <button type="submit" disabled={saving} className="inline-flex min-h-11 items-center justify-center rounded-md bg-gold px-5 text-[13px] font-semibold text-text-inverse hover:bg-gold-hover disabled:opacity-50">{saving ? "Saving…" : experience ? "Save changes" : "Save & open experience"}</button>
          <button type="button" disabled={saving} onClick={onCancel} className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-[13px] font-semibold text-text-secondary hover:bg-surface-hover disabled:opacity-50">Cancel</button>
        </div>
      </form>
    </section>
  );
}
