"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { useEffect, useState } from "react";

import { EvidenceForm } from "@/components/evidence/evidence-form";
import { AppShell } from "@/components/shell/app-shell";
import { getEvidence } from "@/lib/api";
import type { EvidenceRecord } from "@/types/evidence";

export default function EditEvidencePage() {
  const params = useParams<{ id: string }>();
  const evidenceId = params.id;

  const [evidence, setEvidence] =
    useState<EvidenceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadEvidence() {
      try {
        const record = await getEvidence(evidenceId);

        if (!cancelled) {
          setEvidence(record);
          setLoadError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Evidence could not be loaded.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadEvidence();

    return () => {
      cancelled = true;
    };
  }, [evidenceId]);

  return (
    <AppShell sectionLabel="Armory">
      <div className="mx-auto w-full max-w-[920px] px-4 py-7 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <Link
          href={`/armory/${evidenceId}`}
          className="inline-flex items-center gap-2 text-[12px] font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          <ArrowLeft
            aria-hidden="true"
            className="size-4"
            strokeWidth={1.8}
          />
          Back to Evidence
        </Link>

        <header className="mt-7 border-b border-border-subtle pb-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold">
            Armory / Edit Evidence
          </p>

          <h1 className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-text-primary">
            Edit evidence.
          </h1>

          <p className="mt-2 max-w-2xl text-[13px] leading-5 text-text-secondary">
            Update the structured record while preserving its
            identity and history.
          </p>
        </header>

        <div className="pt-6">
          {loading ? (
            <div className="rounded-lg border border-border bg-surface px-5 py-8 text-[13px] text-text-muted">
              Loading evidence...
            </div>
          ) : loadError ? (
            <div className="rounded-lg border border-danger-border bg-danger-surface p-5">
              <div className="flex items-start gap-3">
                <AlertCircle
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-danger-text"
                  strokeWidth={1.8}
                />

                <div>
                  <p className="text-[13px] font-semibold text-danger-text">
                    Evidence could not be loaded.
                  </p>

                  <p className="mt-1 text-[12px] leading-5 text-text-secondary">
                    {loadError}
                  </p>
                </div>
              </div>
            </div>
          ) : evidence ? (
            <EvidenceForm evidence={evidence} />
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}