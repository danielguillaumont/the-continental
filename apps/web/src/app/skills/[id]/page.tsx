"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, BookOpenCheck, ExternalLink, LibraryBig, ShieldCheck, Tags } from "lucide-react";

import { AppShell } from "@/components/shell/app-shell";
import { getSkill } from "@/lib/api";
import { proofCountLabel, skillCoverageLabels } from "@/lib/skill-workspace";
import type { SkillCoverage, SkillDetail } from "@/types/skill";

const coverageClasses: Record<SkillCoverage, string> = {
  verified: "bg-success-surface text-success-text",
  unverified: "bg-warning-surface text-warning-text",
  unsupported: "bg-neutral-status-surface text-neutral-status-text",
};

export default function SkillDetailPage() {
  const params = useParams<{ id: string }>();
  const [skill, setSkill] = useState<SkillDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getSkill(params.id)
      .then((record) => { if (active) { setSkill(record); setError(null); } })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load this skill."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [params.id]);

  return (
    <AppShell sectionLabel="Skills">
      <div className="mx-auto w-full max-w-[1060px] px-4 py-7 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <Link href="/skills" className="inline-flex min-h-10 items-center gap-2 text-[12px] font-semibold text-text-secondary hover:text-gold"><ArrowLeft aria-hidden="true" className="size-4" /> All skills</Link>
        {loading ? <p role="status" className="mt-6 text-[13px] text-text-muted">Loading skill proof…</p> : error ? <div role="alert" className="mt-6 rounded-lg border border-danger-border bg-danger-surface p-5 text-[13px] text-danger-text">{error} <Link href="/skills" className="underline">Return to Skills</Link></div> : skill ? (
          <>
            <div className="mt-5 border-b border-border-subtle pb-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">Skills / proof record</p>
              <h1 className="mt-2 break-words text-[27px] font-semibold tracking-tight sm:text-[32px]">{skill.name}</h1>
              <p className="mt-2 text-[13px] text-text-secondary">Trace this skill to the real evidence records that mention it. The skill itself is not a certification or a proficiency rating.</p>
              <span className={`mt-4 inline-flex rounded-md px-3 py-2 text-[12px] font-semibold ${coverageClasses[skill.coverage]}`}>{skillCoverageLabels[skill.coverage]}</span>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-surface p-5"><Tags className="size-4 text-gold" aria-hidden="true" /><p className="mt-3 text-[12px] text-text-secondary">Supporting records</p><p className="mt-1 text-[24px] font-semibold">{skill.evidenceCount}</p></div>
              <div className="rounded-xl border border-border bg-surface p-5"><ShieldCheck className="size-4 text-success-text" aria-hidden="true" /><p className="mt-3 text-[12px] text-text-secondary">Marked verified</p><p className="mt-1 text-[24px] font-semibold">{skill.verifiedCount}</p></div>
              <div className="rounded-xl border border-border bg-surface p-5"><BookOpenCheck className="size-4 text-warning-text" aria-hidden="true" /><p className="mt-3 text-[12px] text-text-secondary">Unverified</p><p className="mt-1 text-[24px] font-semibold">{skill.unverifiedCount}</p></div>
            </div>
            <div className="mt-7 flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-[18px] font-semibold">Supporting evidence</h2><p className="mt-1 text-[12px] text-text-secondary">{proofCountLabel(skill.evidence.length)}. Click a record to inspect and update the original evidence.</p></div><Link href="/armory" className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border px-3 text-[12px] font-semibold text-text-secondary hover:text-gold"><LibraryBig className="size-4" aria-hidden="true" /> Evidence library</Link></div>
            {skill.evidence.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-border-strong bg-surface p-7 text-center"><p className="text-[15px] font-semibold">This skill has no supporting evidence.</p><p className="mx-auto mt-2 max-w-lg text-[13px] leading-6 text-text-secondary">The skill remains in the inventory after its last supporting record is edited or deleted. Add genuine evidence and tag this skill to restore the connection.</p><Link href="/armory/new" className="mt-4 inline-flex min-h-11 items-center rounded-md bg-gold px-4 text-[13px] font-semibold text-text-inverse">Add evidence</Link></div>
            ) : (
              <ul className="mt-4 space-y-3" aria-label="Linked skill evidence">
                {skill.evidence.map((item) => <li key={item.id} className="rounded-xl border border-border bg-surface p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gold">{item.kind} · {item.status === "verified" ? "marked verified" : "unverified"}</p><Link href={`/armory/${encodeURIComponent(item.id)}`} className="mt-2 inline-flex min-h-8 max-w-full items-center gap-2 break-words text-[16px] font-semibold text-text-primary hover:text-gold">{item.title}<ArrowUpRight aria-hidden="true" className="size-4 shrink-0" /></Link></div><span className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold ${item.status === "verified" ? "bg-success-surface text-success-text" : "bg-warning-surface text-warning-text"}`}>{item.status === "verified" ? "Verified by owner" : "Unverified"}</span></div>
                  <p className="mt-3 whitespace-pre-wrap break-words text-[13px] leading-6 text-text-secondary">{item.description}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border-subtle pt-4 text-[12px] text-text-muted"><span>Evidence date: {item.occurredAt ?? "Not recorded"}</span><span>Source: {item.sourceLabel ?? "Not attached"}</span>{item.sourceUrl && <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-gold hover:underline">Open source <ExternalLink className="size-3.5" aria-hidden="true" /></a>}</div>
                </li>)}
              </ul>
            )}
            <p className="mt-7 text-[12px] leading-6 text-text-muted">Skills are generated and linked through Evidence. Edit the original record to change skill tags or verification. Verified is an owner-provided label, not independent third-party validation.</p>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
