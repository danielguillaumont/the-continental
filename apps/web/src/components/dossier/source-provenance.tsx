"use client";

import { useEffect, useState } from "react";
import { FileCheck2, Fingerprint, ShieldCheck } from "lucide-react";
import {
  attributionLabel, inspectSavedCitations,
} from "@/lib/dossier-provenance";
import type { CitationInspection } from "@/lib/dossier-provenance";
import type { OpportunityRecord } from "@/types/dossier";

export function SourceProvenance({ record }: { record: OpportunityRecord }) {
  const [inspection, setInspection] = useState<CitationInspection | null>(null);

  useEffect(() => {
    let active = true;
    // The parent keys this component by its saved record revision to avoid stale display.
    void inspectSavedCitations(record).then((result) => {
      if (active) setInspection(result);
    });
    return () => { active = false; };
  }, [record]);

  return (
    <section className="rounded-xl border border-border bg-surface p-5 sm:p-6" aria-label="Stored source citations">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">
            <Fingerprint className="size-4" /> Provenance / source record
          </p>
          <h2 className="mt-2 text-[18px] font-semibold text-text-primary">Saved source citations</h2>
        </div>
        <span className="rounded-md border border-gold/30 bg-gold-surface px-2.5 py-1 text-[11px] font-medium text-gold">
          Owner reviewed
        </span>
      </div>
      <p className="mt-3 text-[12px] leading-5 text-text-secondary">
        Citations show the exact words used to support an approved field or technology.
        They are not independent verification of the employer, job posting, or AI model.
      </p>

      {!inspection ? (
        <p role="status" className="mt-4 text-[12px] text-text-secondary">Checking stored citation fingerprints…</p>
      ) : !inspection.fingerprintVerified ? (
        <p role="alert" className="mt-4 rounded-lg border border-danger-border bg-danger-surface p-3 text-[12px] text-danger-text">
          Source fingerprint verification is unavailable. Stored citations have been hidden.
        </p>
      ) : inspection.citations.length === 0 ? (
        <p className="mt-4 rounded-lg border border-border bg-surface-raised p-4 text-[12px] leading-5 text-text-secondary">
          No current source citations to display. Manual entries and approvals saved before
          provenance storage are intentionally not retroactively attributed.
        </p>
      ) : (
        <ul className="mt-4 grid gap-3" aria-label="Verified saved citations">
          {inspection.citations.map((item) => (
            <li key={item.id} className="min-w-0 rounded-lg border border-border bg-surface-raised p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-[12px] font-semibold text-text-primary">
                  <FileCheck2 className="size-4 text-gold" />{item.value}
                </p>
                <span className="text-[11px] text-text-muted">{attributionLabel(item)}</span>
              </div>
              <blockquote className="mt-3 whitespace-pre-wrap break-words border-l-2 border-gold/60 pl-3 font-mono text-[11px] leading-5 text-text-secondary">
                “{item.sourceExcerpt}”
              </blockquote>
              <a href="#original-source" className="mt-3 inline-flex min-h-8 items-center gap-1.5 text-[11px] font-semibold text-gold hover:underline">
                <ShieldCheck className="size-3.5" /> Compare with original posting
              </a>
            </li>
          ))}
        </ul>
      )}
      {inspection && inspection.fingerprintVerified && inspection.excludedCount > 0 && (
        <p role="status" className="mt-3 text-[11px] text-text-muted">
          {inspection.excludedCount} outdated or unsupported citation{inspection.excludedCount === 1 ? " was" : "s were"} hidden.
        </p>
      )}
    </section>
  );
}
