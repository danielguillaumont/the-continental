"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { EvidenceRow } from "@/components/evidence/evidence-row";
import { listEvidence } from "@/lib/api";
import type { EvidenceRecord } from "@/types/evidence";

export function RecentEvidence() {
  const [records, setRecords] = useState<EvidenceRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void listEvidence()
      .then((loaded) => {
        if (!active) return;
        setRecords(
          [...loaded]
            .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
            .slice(0, 5),
        );
        setError(null);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(
            cause instanceof Error ? cause.message : "Unable to load saved evidence.",
          );
        }
      });

    return () => { active = false; };
  }, []);

  return (
    <section aria-labelledby="recent-evidence-heading">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="recent-evidence-heading" className="text-[15px] font-semibold text-text-primary">
            Recent evidence
          </h2>
          <p className="mt-1 text-[12px] text-text-muted">
            Real records from your Evidence library, not demo examples.
          </p>
        </div>
        <Link href="/armory" className="text-[12px] font-semibold text-gold hover:text-gold-hover">
          View all evidence
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        {error ? (
          <div role="alert" className="px-5 py-5 text-[13px] text-danger-text">
            Could not load recent evidence: {error}. Check the API Server terminal.
          </div>
        ) : records === null ? (
          <div className="px-5 py-6 text-[13px] text-text-muted">Loading saved evidence...</div>
        ) : records.length === 0 ? (
          <div className="px-5 py-6 text-[13px] text-text-secondary">
            No evidence records yet. <Link className="font-semibold text-gold hover:text-gold-hover" href="/armory/new">Add evidence</Link> to get started.
          </div>
        ) : (
          records.map((item) => <EvidenceRow key={item.id} {...item} />)
        )}
      </div>
    </section>
  );
}
