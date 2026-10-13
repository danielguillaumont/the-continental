"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Clock3,
  ExternalLink,
  FileText,
  Link2,
  Pencil,
  ShieldCheck,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/shell/app-shell";
import {
  deleteEvidence,
  getEvidence,
} from "@/lib/api";
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
  const router = useRouter();
  const evidenceId = params.id;

  const [evidence, setEvidence] =
    useState<EvidenceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] =
    useState<string | null>(null);

  const [showDeleteDialog, setShowDeleteDialog] =
    useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] =
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

  useEffect(() => {
    if (!showDeleteDialog) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isDeleting) {
        setShowDeleteDialog(false);
        setDeleteError(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showDeleteDialog, isDeleting]);

  async function handleDelete() {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteEvidence(evidenceId);

      router.push("/armory");
      router.refresh();
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Evidence could not be deleted.",
      );
      setIsDeleting(false);
    }
  }

  function openDeleteDialog() {
    setDeleteError(null);
    setShowDeleteDialog(true);
  }

  function closeDeleteDialog() {
    if (isDeleting) {
      return;
    }

    setDeleteError(null);
    setShowDeleteDialog(false);
  }

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
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
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
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link
                    href={`/armory/${evidence.id}/edit`}
                    className="inline-flex h-9 w-fit items-center gap-2 rounded-md border border-border bg-surface-raised px-3.5 text-[12px] font-semibold text-text-primary transition-colors duration-150 hover:border-border-strong hover:bg-surface-hover"
                  >
                    <Pencil
                      aria-hidden="true"
                      className="size-3.5"
                      strokeWidth={1.8}
                    />
                    Edit Evidence
                  </Link>

                  <button
                    type="button"
                    onClick={openDeleteDialog}
                    className="inline-flex h-9 w-fit items-center gap-2 rounded-md border border-danger-border bg-danger-surface px-3.5 text-[12px] font-semibold text-danger-text transition-colors duration-150 hover:border-danger-text"
                  >
                    <Trash2
                      aria-hidden="true"
                      className="size-3.5"
                      strokeWidth={1.8}
                    />
                    Delete Evidence
                  </button>
                </div>
              </div>
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

      {showDeleteDialog && evidence ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-evidence-title"
            className="w-full max-w-[460px] rounded-lg border border-danger-border bg-surface shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-danger-border bg-danger-surface">
                  <Trash2
                    aria-hidden="true"
                    className="size-4 text-danger-text"
                    strokeWidth={1.8}
                  />
                </div>

                <div>
                  <h2
                    id="delete-evidence-title"
                    className="text-[15px] font-semibold text-text-primary"
                  >
                    Delete evidence?
                  </h2>

                  <p className="mt-1 text-[12px] leading-5 text-text-secondary">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeDeleteDialog}
                disabled={isDeleting}
                aria-label="Close delete confirmation"
                className="flex size-8 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.8}
                />
              </button>
            </div>

            <div className="px-5 py-5">
              <p className="text-[13px] leading-5 text-text-secondary">
                You are about to permanently remove:
              </p>

              <div className="mt-3 rounded-md border border-border bg-surface-raised px-4 py-3">
                <p className="text-[13px] font-semibold text-text-primary">
                  {evidence.title}
                </p>

                <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-text-muted">
                  {formatKind(evidence.kind)}
                </p>
              </div>

              <p className="mt-4 text-[12px] leading-5 text-text-muted">
                The record will be removed from the Armory and
                permanently deleted from The Continental database.
              </p>

              {deleteError ? (
                <div className="mt-4 rounded-md border border-danger-border bg-danger-surface p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-danger-text"
                      strokeWidth={1.8}
                    />

                    <p className="text-[12px] leading-5 text-danger-text">
                      {deleteError}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-border-subtle px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDeleteDialog}
                disabled={isDeleting}
                className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-surface-raised px-4 text-[12px] font-semibold text-text-primary transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-danger-border bg-danger-surface px-4 text-[12px] font-semibold text-danger-text transition-colors hover:border-danger-text disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2
                  aria-hidden="true"
                  className="size-3.5"
                  strokeWidth={1.8}
                />

                {isDeleting
                  ? "Deleting..."
                  : "Delete Evidence"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}