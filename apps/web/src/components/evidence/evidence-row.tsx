import Link from "next/link";
import {
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";

import type { EvidenceRecord } from "@/types/evidence";

function formatKind(kind: EvidenceRecord["kind"]) {
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

function formatEvidenceDate(value?: string | null) {
  if (!value) {
    return "No date";
  }

  const date = new Date(`${value}T00:00:00`);

  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
  }).format(date);
}

export function EvidenceRow({
  id,
  kind,
  title,
  description,
  skills,
  status,
  occurredAt,
}: EvidenceRecord) {
  const verified = status === "verified";

  return (
    <article className="group border-b border-border-subtle last:border-b-0">
      <Link
        href={`/armory/${id}`}
        className="block px-4 py-4 transition-colors duration-150 hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-gold sm:px-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
              {formatKind(kind)}
            </span>

            {verified ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success-text">
                <ShieldCheck
                  aria-hidden="true"
                  className="size-3.5"
                  strokeWidth={1.8}
                />
                Verified
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <span className="font-technical text-[11px] text-text-muted">
              {formatEvidenceDate(occurredAt)}
            </span>

            <ArrowUpRight
              aria-hidden="true"
              className="size-3.5 text-text-disabled transition-colors group-hover:text-gold"
              strokeWidth={1.8}
            />
          </div>
        </div>

        <h3 className="mt-1.5 text-[14px] font-semibold text-text-primary transition-colors group-hover:text-gold-hover">
          {title}
        </h3>

        <p className="mt-1 max-w-3xl text-[13px] leading-5 text-text-secondary">
          {description}
        </p>

        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
          {skills.map((skill) => (
            <span
              key={skill}
              className="text-[11px] text-text-muted"
            >
              {skill}
            </span>
          ))}
        </div>
      </Link>
    </article>
  );
}