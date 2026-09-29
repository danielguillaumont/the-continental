"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Clock3,
  ExternalLink,
  FileText,
  Link2,
  ShieldCheck,
  Tags,
} from "lucide-react";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/shell/app-shell";
import { getEvidence } from "@/lib/api";
import type { EvidenceRecord } from "@/types/evidence";

function formatKind(kind: EvidenceRecord["kind"]) {
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

function formatEvidenceDate(value?: string | null) {
  if (!value) {
    return "No evidence date";
  }

  const date = new Date(`${value}T00:00:00`);

  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatTimestamp(value: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function EvidenceDetailPage() {
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
      <div className="mx-auto w-full max-w-[1120px] px-4 py-7 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <Link
          href="/armory"
          className="inline-flex items-center gap-2 text-[12px] font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          <ArrowLeft
            aria-hidden="true"
            className="size-4"
            strokeWidth={1.8}
          />
          Back to Armory
        </Link>

        {loading ? (
          <div className="mt-8 rounded-lg border border-border bg-surface px-5 py-8 text-[13px] text-text-muted">
            Loading evidence...
          </div>
        ) : loadError ? (
          <div className="mt-8 rounded-lg border border-danger-border bg-danger-surface p-5">
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
          <>
            <header className="mt-7 border-b border-border-subtle pb-7">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold">
                  {formatKind(evidence.kind)}
                </span>

                {evidence.status === "verified" ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-success-text">
                    <ShieldCheck
                      aria-hidden="true"
                      className="size-3.5"
                      strokeWidth={1.8}
                    />
                    Verified
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-text-muted">
                    Unverified
                  </span>
                )}
              </div>

              <h1 className="mt-3 max-w-4xl text-[26px] font-semibold tracking-[-0.025em] text-text-primary sm:text-[30px]">
                {evidence.title}
              </h1>

              <p className="mt-3 max-w-3xl text-[14px] leading-6 text-text-secondary">
                {evidence.description}
              </p>
            </header>

            <div className="grid gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-6">
                <section className="overflow-hidden rounded-lg border border-border bg-surface">
                  <div className="border-b border-border-subtle px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Tags
                        aria-hidden="true"
                        className="size-4 text-gold"
                        strokeWidth={1.8}
                      />

                      <h2 className="text-[14px] font-semibold text-text-primary">
                        Supported skills
                      </h2>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 p-5">
                    {evidence.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-md border border-border bg-surface-raised px-2.5 py-1.5 text-[12px] text-text-secondary"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>

                <section className="overflow-hidden rounded-lg border border-border bg-surface">
                  <div className="border-b border-border-subtle px-5 py-4">
                    <div className="flex items-center gap-2">
                      <FileText
                        aria-hidden="true"
                        className="size-4 text-gold"
                        strokeWidth={1.8}
                      />

                      <h2 className="text-[14px] font-semibold text-text-primary">
                        Evidence record
                      </h2>
                    </div>
                  </div>

                  <dl className="divide-y divide-border-subtle">
                    <div className="grid gap-1 px-5 py-4 sm:grid-cols-[160px_1fr] sm:gap-6">
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                        Type
                      </dt>

                      <dd className="text-[13px] text-text-primary">
                        {formatKind(evidence.kind)}
                      </dd>
                    </div>

                    <div className="grid gap-1 px-5 py-4 sm:grid-cols-[160px_1fr] sm:gap-6">
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                        Verification
                      </dt>

                      <dd className="text-[13px] text-text-primary">
                        {evidence.status === "verified"
                          ? "Verified"
                          : "Unverified"}
                      </dd>
                    </div>

                    <div className="grid gap-1 px-5 py-4 sm:grid-cols-[160px_1fr] sm:gap-6">
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                        Record ID
                      </dt>

                      <dd className="break-all font-technical text-[11px] text-text-secondary">
                        {evidence.id}
                      </dd>
                    </div>
                  </dl>
                </section>
              </div>

              <aside className="space-y-4">
                <section className="rounded-lg border border-border bg-surface p-5">
                  <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                    Provenance
                  </h2>

                  <div className="mt-4 space-y-4">
                    <div>
                      <div className="flex items-center gap-2 text-[11px] text-text-muted">
                        <CalendarDays
                          aria-hidden="true"
                          className="size-3.5"
                          strokeWidth={1.8}
                        />
                        Evidence date
                      </div>

                      <p className="mt-1.5 text-[13px] text-text-primary">
                        {formatEvidenceDate(
                          evidence.occurredAt,
                        )}
                      </p>
                    </div>

                    {evidence.source ? (
                      <div>
                        <div className="flex items-center gap-2 text-[11px] text-text-muted">
                          <Link2
                            aria-hidden="true"
                            className="size-3.5"
                            strokeWidth={1.8}
                          />
                          Source
                        </div>

                        {evidence.source.url ? (
                          <a
                            href={evidence.source.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-gold transition-colors hover:text-gold-hover"
                          >
                            {evidence.source.label}

                            <ExternalLink
                              aria-hidden="true"
                              className="size-3.5"
                              strokeWidth={1.8}
                            />
                          </a>
                        ) : (
                          <p className="mt-1.5 text-[13px] text-text-primary">
                            {evidence.source.label}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2 text-[11px] text-text-muted">
                          <Link2
                            aria-hidden="true"
                            className="size-3.5"
                            strokeWidth={1.8}
                          />
                          Source
                        </div>

                        <p className="mt-1.5 text-[13px] text-text-muted">
                          No source attached
                        </p>
                      </div>
                    )}
                  </div>
                </section>

                <section className="rounded-lg border border-border bg-surface p-5">
                  <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                    Record history
                  </h2>

                  <div className="mt-4 space-y-4">
                    <div>
                      <div className="flex items-center gap-2 text-[11px] text-text-muted">
                        <Clock3
                          aria-hidden="true"
                          className="size-3.5"
                          strokeWidth={1.8}
                        />
                        Created
                      </div>

                      <p className="mt-1.5 text-[12px] text-text-secondary">
                        {formatTimestamp(evidence.createdAt)}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-[11px] text-text-muted">
                        <Clock3
                          aria-hidden="true"
                          className="size-3.5"
                          strokeWidth={1.8}
                        />
                        Last updated
                      </div>

                      <p className="mt-1.5 text-[12px] text-text-secondary">
                        {formatTimestamp(evidence.updatedAt)}
                      </p>
                    </div>
                  </div>
                </section>
              </aside>
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}