"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  FilePlus2,
  ShieldCheck,
} from "lucide-react";

import type {
  EvidenceKind,
  EvidenceStatus,
} from "@/types/evidence";

type EvidenceDraft = {
  kind: EvidenceKind;
  title: string;
  description: string;
  skills: string;
  status: EvidenceStatus;
  sourceLabel: string;
  sourceUrl: string;
  occurredAt: string;
};

type FormErrors = Partial<Record<keyof EvidenceDraft, string>>;

const initialDraft: EvidenceDraft = {
  kind: "project",
  title: "",
  description: "",
  skills: "",
  status: "unverified",
  sourceLabel: "",
  sourceUrl: "",
  occurredAt: "",
};

const evidenceKinds: {
  value: EvidenceKind;
  label: string;
}[] = [
  {
    value: "project",
    label: "Project",
  },
  {
    value: "experience",
    label: "Experience",
  },
  {
    value: "certification",
    label: "Certification",
  },
  {
    value: "education",
    label: "Education",
  },
  {
    value: "artifact",
    label: "Artifact",
  },
];

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function EvidenceForm() {
  const [draft, setDraft] = useState<EvidenceDraft>(initialDraft);
  const [errors, setErrors] = useState<FormErrors>({});
  const [reviewed, setReviewed] = useState(false);

  const parsedSkills = useMemo(
    () =>
      draft.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
    [draft.skills],
  );

  function updateField<K extends keyof EvidenceDraft>(
    field: K,
    value: EvidenceDraft[K],
  ) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));

    setReviewed(false);
  }

  function validate() {
    const nextErrors: FormErrors = {};

    if (draft.title.trim().length < 3) {
      nextErrors.title = "Enter a clear title.";
    }

    if (draft.description.trim().length < 10) {
      nextErrors.description =
        "Add a short description of what this evidence proves.";
    }

    if (parsedSkills.length === 0) {
      nextErrors.skills = "Add at least one skill.";
    }

    if (draft.sourceUrl.trim() && !isValidHttpUrl(draft.sourceUrl.trim())) {
      nextErrors.sourceUrl = "Enter a valid http:// or https:// URL.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validate()) {
      setReviewed(false);
      return;
    }

    setReviewed(true);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="border-b border-border-subtle px-5 py-4">
          <div className="flex items-center gap-2">
            <FilePlus2
              aria-hidden="true"
              className="size-4 text-gold"
              strokeWidth={1.8}
            />

            <h2 className="text-[14px] font-semibold text-text-primary">
              Evidence details
            </h2>
          </div>

          <p className="mt-1 text-[12px] leading-5 text-text-muted">
            Describe something real that can support a future career claim.
          </p>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="kind"
                className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted"
              >
                Evidence type
              </label>

              <select
                id="kind"
                value={draft.kind}
                onChange={(event) =>
                  updateField(
                    "kind",
                    event.target.value as EvidenceKind,
                  )
                }
                className="h-10 w-full rounded-md border border-border bg-surface-raised px-3 text-[13px] text-text-primary outline-none transition-colors focus:border-gold"
              >
                {evidenceKinds.map((kind) => (
                  <option
                    key={kind.value}
                    value={kind.value}
                  >
                    {kind.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="status"
                className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted"
              >
                Verification
              </label>

              <select
                id="status"
                value={draft.status}
                onChange={(event) =>
                  updateField(
                    "status",
                    event.target.value as EvidenceStatus,
                  )
                }
                className="h-10 w-full rounded-md border border-border bg-surface-raised px-3 text-[13px] text-text-primary outline-none transition-colors focus:border-gold"
              >
                <option value="unverified">Unverified</option>
                <option value="verified">Verified by me</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="title"
              className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted"
            >
              Title
            </label>

            <input
              id="title"
              type="text"
              value={draft.title}
              onChange={(event) =>
                updateField("title", event.target.value)
              }
              placeholder="Example: Shodan Automation"
              className="h-10 w-full rounded-md border border-border bg-surface-raised px-3 text-[13px] text-text-primary outline-none transition-colors placeholder:text-text-disabled focus:border-gold"
            />

            {errors.title ? (
              <p className="mt-1.5 text-[11px] text-danger-text">
                {errors.title}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted"
            >
              Description
            </label>

            <textarea
              id="description"
              rows={5}
              value={draft.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              placeholder="What did you build, do, learn, or prove?"
              className="w-full resize-y rounded-md border border-border bg-surface-raised px-3 py-2.5 text-[13px] leading-5 text-text-primary outline-none transition-colors placeholder:text-text-disabled focus:border-gold"
            />

            {errors.description ? (
              <p className="mt-1.5 text-[11px] text-danger-text">
                {errors.description}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="skills"
              className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted"
            >
              Skills
            </label>

            <input
              id="skills"
              type="text"
              value={draft.skills}
              onChange={(event) =>
                updateField("skills", event.target.value)
              }
              placeholder="Python, Azure DevOps, Security Automation"
              className="h-10 w-full rounded-md border border-border bg-surface-raised px-3 text-[13px] text-text-primary outline-none transition-colors placeholder:text-text-disabled focus:border-gold"
            />

            <p className="mt-1.5 text-[11px] text-text-muted">
              Separate skills with commas.
            </p>

            {errors.skills ? (
              <p className="mt-1.5 text-[11px] text-danger-text">
                {errors.skills}
              </p>
            ) : null}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="source-label"
                className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted"
              >
                Source label
              </label>

              <input
                id="source-label"
                type="text"
                value={draft.sourceLabel}
                onChange={(event) =>
                  updateField("sourceLabel", event.target.value)
                }
                placeholder="GitHub repository"
                className="h-10 w-full rounded-md border border-border bg-surface-raised px-3 text-[13px] text-text-primary outline-none transition-colors placeholder:text-text-disabled focus:border-gold"
              />
            </div>

            <div>
              <label
                htmlFor="occurred-at"
                className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted"
              >
                Evidence date
              </label>

              <input
                id="occurred-at"
                type="date"
                value={draft.occurredAt}
                onChange={(event) =>
                  updateField("occurredAt", event.target.value)
                }
                className="h-10 w-full rounded-md border border-border bg-surface-raised px-3 text-[13px] text-text-primary outline-none transition-colors focus:border-gold"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="source-url"
              className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted"
            >
              Source URL
            </label>

            <input
              id="source-url"
              type="url"
              value={draft.sourceUrl}
              onChange={(event) =>
                updateField("sourceUrl", event.target.value)
              }
              placeholder="https://github.com/..."
              className="h-10 w-full rounded-md border border-border bg-surface-raised px-3 text-[13px] text-text-primary outline-none transition-colors placeholder:text-text-disabled focus:border-gold"
            />

            {errors.sourceUrl ? (
              <p className="mt-1.5 text-[11px] text-danger-text">
                {errors.sourceUrl}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {reviewed ? (
        <div className="rounded-lg border border-success-border bg-success-surface p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-success-text"
              strokeWidth={1.8}
            />

            <div>
              <p className="text-[13px] font-semibold text-success-text">
                Evidence record is valid.
              </p>

              <p className="mt-1 text-[12px] leading-5 text-text-secondary">
                {parsedSkills.length} skill
                {parsedSkills.length === 1 ? "" : "s"} linked. Persistence is
                the next implementation step.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-border-subtle pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-[11px] text-text-muted">
          <ShieldCheck
            aria-hidden="true"
            className="size-4"
            strokeWidth={1.8}
          />

          Nothing is saved yet.
        </div>

        <button
          type="submit"
          className="inline-flex h-9 w-fit items-center justify-center rounded-md bg-gold px-4 text-[13px] font-semibold text-text-inverse transition-colors duration-150 hover:bg-gold-hover active:bg-gold-active"
        >
          Review Evidence
        </button>
      </div>
    </form>
  );
}