"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  LibraryBig,
  Plus,
  ShieldCheck,
  Tags,
} from "lucide-react";

import { EvidenceRow } from "@/components/evidence/evidence-row";
import { AppShell } from "@/components/shell/app-shell";
import { listEvidence } from "@/lib/api";
import type { EvidenceRecord } from "@/types/evidence";

export default function ArmoryPage() {
  const [evidenceItems, setEvidenceItems] = useState<
    EvidenceRecord[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    async function loadEvidence() {
      try {
        const records = await listEvidence();

        if (!cancelled) {
          setEvidenceItems(records);
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
  }, []);

  const verifiedCount = useMemo(
    () =>
      evidenceItems.filter(
        (item) => item.status === "verified",
      ).length,
    [evidenceItems],
  );

  const uniqueSkills = useMemo(
    () =>
      new Set(
        evidenceItems.flatMap((item) => item.skills),
      ).size,
    [evidenceItems],
  );

  return (
    <AppShell sectionLabel="Armory">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-7 sm:px-6 sm:py-8 lg:px-8 lg:py-10 xl:px-10">
        <div className="flex flex-col gap-5 border-b border-border-subtle pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold">
              Armory
            </p>

            <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-text-primary sm:text-[24px]">
              Your evidence, organized.
            </h1>

            <p className="mt-2 max-w-2xl text-[13px] leading-5 text-text-secondary">
              The Armory is the structured record of projects,
              experience, certifications, education, and artifacts
              that The Continental can use to support career claims.
            </p>
          </div>

          <Link
            href="/armory/new"
            className="inline-flex h-9 w-fit shrink-0 items-center gap-2 rounded-md bg-gold px-3.5 text-[13px] font-semibold text-text-inverse transition-colors duration-150 hover:bg-gold-hover active:bg-gold-active"
          >
            <Plus
              aria-hidden="true"
              className="size-4"
              strokeWidth={1.8}
            />
            Add Evidence
          </Link>
        </div>

        <section
          aria-label="Evidence summary"
          className="grid gap-3 py-6 sm:grid-cols-3"
        >
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-text-muted">
              <LibraryBig
                aria-hidden="true"
                className="size-4"
                strokeWidth={1.8}
              />
              Evidence
            </div>

            <div className="mt-3 text-[24px] font-semibold tracking-tight text-text-primary">
              {loading ? "—" : evidenceItems.length}
            </div>

            <div className="mt-1 text-[12px] text-text-muted">
              total records
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-text-muted">
              <ShieldCheck
                aria-hidden="true"
                className="size-4"
                strokeWidth={1.8}
              />
              Verified
            </div>

            <div className="mt-3 text-[24px] font-semibold tracking-tight text-text-primary">
              {loading ? "—" : verifiedCount}
            </div>

            <div className="mt-1 text-[12px] text-text-muted">
              supported records
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-text-muted">
              <Tags
                aria-hidden="true"
                className="size-4"
                strokeWidth={1.8}
              />
              Skills
            </div>

            <div className="mt-3 text-[24px] font-semibold tracking-tight text-text-primary">
              {loading ? "—" : uniqueSkills}
            </div>

            <div className="mt-1 text-[12px] text-text-muted">
              represented skills
            </div>
          </div>
        </section>

        <section aria-labelledby="armory-records-heading">
          <div className="mb-3">
            <h2
              id="armory-records-heading"
              className="text-[15px] font-semibold text-text-primary"
            >
              Evidence records
            </h2>

            <p className="mt-1 text-[12px] text-text-muted">
              Inspectable records that can later support
              opportunity matching, applications, and grounded AI
              workflows.
            </p>
          </div>

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

                  <p className="mt-1 text-[12px] text-text-secondary">
                    {loadError}
                  </p>
                </div>
              </div>
            </div>
          ) : evidenceItems.length === 0 ? (
            <div className="rounded-lg border border-border bg-surface px-5 py-8">
              <p className="text-[14px] font-semibold text-text-primary">
                The Armory is empty.
              </p>

              <p className="mt-1 text-[12px] text-text-muted">
                Add your first evidence record to begin building
                your career inventory.
              </p>

              <Link
                href="/armory/new"
                className="mt-4 inline-flex text-[12px] font-semibold text-gold transition-colors hover:text-gold-hover"
              >
                Add Evidence
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-surface">
              {evidenceItems.map((item) => (
                <EvidenceRow
                  key={item.id}
                  {...item}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}