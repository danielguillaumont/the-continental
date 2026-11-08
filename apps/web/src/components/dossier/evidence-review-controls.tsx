"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, ClipboardCheck, RefreshCw, Trash2 } from "lucide-react";
import {
  deleteOpportunityEvidenceReview,
  getOpportunityEvidenceReviewOptions,
  getOpportunityEvidenceReviews,
  saveOpportunityEvidenceReview,
} from "@/lib/api";
import { DossierHttpError } from "@/lib/dossier-request";
import {
  reviewDecisionLabel, reviewPairKey, validateEvidenceReviewWrite,
} from "@/lib/dossier-evidence-reviews";
import type {
  EvidenceReviewCollection, EvidenceReviewDecision,
  EvidenceReviewOptions, EvidenceReviewRecord, EvidenceReviewWrite,
} from "@/types/dossier-evidence-review";
import type { EvidenceMatchCandidate, EvidenceMatchRequirement } from "@/types/dossier-evidence-match";

const baseButton = "inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-border-strong px-3 text-[11px] font-semibold text-text-primary hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-50";

type ReviewLedger = {
  options: EvidenceReviewOptions;
  collection: EvidenceReviewCollection;
};

export function useEvidenceReviewLedger(opportunityId: string) {
  const [ledger, setLedger] = useState<ReviewLedger | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [unconfirmedWrite, setUnconfirmedWrite] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const sequence = useRef(0);
  const writeLock = useRef(false);

  const readLedger = useCallback(() => Promise.all([
    getOpportunityEvidenceReviewOptions(opportunityId),
    getOpportunityEvidenceReviews(opportunityId),
  ]).then(([options, collection]) => ({ options, collection })), [opportunityId]);

  // Initial data fetch deliberately does not synchronously set state inside an effect.
  useEffect(() => {
    const seq = ++sequence.current;
    void readLedger().then((result) => {
      if (sequence.current !== seq) return;
      setLedger(result);
      setError(null);
    }, (cause: unknown) => {
      if (sequence.current !== seq) return;
      setLedger(null);
      setError(cause instanceof Error ? cause.message : "Could not load saved reviews.");
    }).finally(() => {
      if (sequence.current === seq) setLoading(false);
    });
    return () => { sequence.current += 1; };
  }, [readLedger]);

  const refresh = useCallback(async (): Promise<boolean> => {
    const seq = ++sequence.current;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const result = await readLedger();
      if (sequence.current !== seq) return false;
      setLedger(result);
      setUnconfirmedWrite(false);
      return true;
    } catch (cause: unknown) {
      if (sequence.current !== seq) return false;
      setError(cause instanceof Error ? cause.message : "Could not refresh reviews.");
      return false;
    } finally {
      if (sequence.current === seq) setLoading(false);
    }
  }, [readLedger]);

  const apply = useCallback(async (
    requirementId: string, evidenceId: string, payload: EvidenceReviewWrite | null,
  ): Promise<boolean> => {
    if (writeLock.current || unconfirmedWrite || !ledger) return false;
    writeLock.current = true;
    const key = reviewPairKey(requirementId, evidenceId);
    setBusyKey(key);
    setError(null);
    setMessage(null);
    try {
      if (payload) await saveOpportunityEvidenceReview(opportunityId, requirementId, evidenceId, payload);
      else await deleteOpportunityEvidenceReview(opportunityId, requirementId, evidenceId);
      // A successful mutation is not considered confirmed in the UI until
      // the server's saved state can be retrieved again.
      const reconciled = await readLedger();
      setLedger(reconciled);
      setUnconfirmedWrite(false);
      setMessage(payload ? "Review saved and confirmed from the server." : "Review removed and confirmed from the server.");
      return true;
    } catch (cause: unknown) {
      if (cause instanceof DossierHttpError && cause.status < 500) {
        setError(`${cause.message} Refresh review options before submitting again.`);
      } else {
        setUnconfirmedWrite(true);
        setError("The review change could not be confirmed. It may have been saved. Refresh reviews to reconcile before submitting another change.");
      }
      return false;
    } finally {
      setBusyKey(null);
      writeLock.current = false;
    }
  }, [ledger, opportunityId, readLedger, unconfirmedWrite]);

  const byOption = new Map((ledger?.options.candidates ?? []).map((option) => [
    reviewPairKey(option.requirementId, option.evidenceId), option,
  ]));
  const byReview = new Map((ledger?.collection.reviews ?? []).map((review) => [
    reviewPairKey(review.requirementId, review.evidenceId), review,
  ]));

  return { loading, error, message, unconfirmedWrite, busyKey, byOption, byReview,
    reviews: ledger?.collection.reviews ?? [], ready: ledger !== null, refresh, apply };
}

export type EvidenceReviewLedgerState = ReturnType<typeof useEvidenceReviewLedger>;

export function ReviewLedgerStatus({ state }: { state: EvidenceReviewLedgerState }) {
  const reviewed = state.reviews.filter((row) => row.reviewStatus === "current").length;
  const stale = state.reviews.filter((row) => row.reviewStatus === "stale").length;
  return <div className="border-b border-border-subtle px-5 py-4 sm:px-7">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="flex items-center gap-2 text-[12px] font-semibold text-text-primary"><ClipboardCheck aria-hidden="true" className="size-4 text-gold" /> Human review ledger</p>
        <p className="mt-1 text-[11px] leading-5 text-text-secondary">{state.loading && !state.ready ? "Loading saved review decisions…" : state.ready ? `${reviewed} current owner decision${reviewed === 1 ? "" : "s"}${stale ? ` · ${stale} stale` : ""}. Candidate matches are not reviewed automatically.` : "Review actions unavailable; candidate discovery remains read-only."}</p>
      </div>
      <button type="button" className={baseButton} disabled={state.loading || Boolean(state.busyKey)} onClick={() => void state.refresh()}><RefreshCw aria-hidden="true" className={`size-3.5 ${state.loading ? "animate-spin" : ""}`} /> Refresh reviews</button>
    </div>
    {state.error && <p role="alert" className="mt-3 rounded-md border border-warning-border bg-warning-surface p-3 text-[12px] leading-5 text-warning-text">{state.error}</p>}
    {state.message && <p role="status" className="mt-3 rounded-md border border-success-border bg-success-surface p-3 text-[12px] text-success-text">{state.message}</p>}
  </div>;
}

export function EvidenceReviewAction({
  requirementId, candidate, state,
}: { requirementId: string; candidate: EvidenceMatchCandidate; state: EvidenceReviewLedgerState }) {
  const key = reviewPairKey(requirementId, candidate.id);
  const option = state.byOption.get(key);
  const review = state.byReview.get(key) ?? option?.currentReview ?? null;
  const [editing, setEditing] = useState(false);
  const [confirmRemoval, setConfirmRemoval] = useState(false);
  const [decision, setDecision] = useState<EvidenceReviewDecision>("supports");
  const [note, setNote] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const isBusy = Boolean(state.busyKey);
  const disabled = state.loading || isBusy || state.unconfirmedWrite || !state.ready || !option;
  const stale = review?.reviewStatus === "stale";

  const begin = () => {
    if (!option || disabled) return;
    setDecision(review?.decision ?? "supports");
    setNote(review?.note ?? "");
    setLocalError(null);
    setConfirmRemoval(false);
    setEditing(true);
  };

  const save = async () => {
    if (!option) return;
    const payload: EvidenceReviewWrite = { decision, note, expectedFingerprint: option.fingerprint };
    const issue = validateEvidenceReviewWrite(payload);
    if (issue) { setLocalError(issue); return; }
    setLocalError(null);
    const saved = await state.apply(requirementId, candidate.id, payload);
    if (saved) setEditing(false);
  };

  return <div className="mt-4 border-t border-border-subtle pt-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">Owner review</p>
        {review ? <p className={`mt-1 text-[11px] font-semibold ${stale ? "text-warning-text" : "text-success-text"}`}>{stale ? "Stale — reassessment required" : reviewDecisionLabel(review.decision)}</p> : <p className="mt-1 text-[11px] text-text-secondary">Not reviewed · suggestion only</p>}
      </div>
      {!editing && <button type="button" className={baseButton} disabled={disabled} onClick={begin}>{review ? "Revisit decision" : "Review evidence"}</button>}
    </div>
    {review && !editing && <div className="mt-3 rounded-md border border-border bg-canvas/40 p-3">
      <p className="whitespace-pre-wrap break-words text-[12px] leading-5 text-text-secondary">{review.note || "No explanation recorded for this decision."}</p>
      {stale && <p className="mt-2 text-[11px] text-warning-text">The requirement, evidence or candidate relationship changed. This decision is retained for reference, not counted as current.</p>}
      <button type="button" className="mt-2 inline-flex min-h-8 items-center gap-1 text-[11px] text-text-muted underline hover:text-danger-text disabled:opacity-50" disabled={state.loading || isBusy || state.unconfirmedWrite} onClick={() => setConfirmRemoval((current) => !current)}><Trash2 aria-hidden="true" className="size-3.5" /> Remove decision</button>
      {confirmRemoval && <div className="mt-2 rounded-md border border-danger-border bg-danger-surface p-3"><p className="text-[11px] leading-5 text-danger-text">Remove this owner review? The evidence record itself will not be deleted.</p><div className="mt-2 flex flex-wrap gap-2"><button type="button" className={baseButton} disabled={isBusy} onClick={() => void state.apply(requirementId, candidate.id, null).then((ok) => { if (ok) setConfirmRemoval(false); })}>Confirm removal</button><button type="button" className={baseButton} onClick={() => setConfirmRemoval(false)}>Cancel</button></div></div>}
    </div>}
    {editing && <div className="mt-3 space-y-3 rounded-lg border border-gold/25 bg-gold-surface/20 p-4">
      <p className="text-[12px] font-semibold text-text-primary">Does this specific record support this requirement?</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Choose an owner review decision">
        <button type="button" aria-pressed={decision === "supports"} disabled={isBusy} onClick={() => setDecision("supports")} className={`${baseButton} ${decision === "supports" ? "border-success-border bg-success-surface text-success-text" : ""}`}>Supports requirement</button>
        <button type="button" aria-pressed={decision === "not_relevant"} disabled={isBusy} onClick={() => setDecision("not_relevant")} className={`${baseButton} ${decision === "not_relevant" ? "border-warning-border bg-warning-surface text-warning-text" : ""}`}>Not relevant</button>
      </div>
      <label className="block text-[11px] font-semibold text-text-secondary" htmlFor={`review-note-${requirementId}-${candidate.id}`}>Your reasoning {decision === "supports" ? "(required)" : "(optional)"}</label>
      <textarea id={`review-note-${requirementId}-${candidate.id}`} value={note} maxLength={1200} rows={3} disabled={isBusy} onChange={(event) => { setNote(event.target.value); setLocalError(null); }} placeholder="What specifically in this evidence supports or does not support the requirement?" className="block w-full resize-y rounded-md border border-border-strong bg-surface px-3 py-2 text-[12px] leading-5 text-text-primary outline-none focus:border-gold" />
      <p className="text-right text-[10px] text-text-muted">{note.length} / 1,200</p>
      {localError && <p role="alert" className="text-[11px] text-danger-text">{localError}</p>}
      <div className="flex flex-wrap items-center gap-2"><button type="button" disabled={disabled} onClick={() => void save()} className="min-h-9 rounded-md bg-gold px-4 text-[11px] font-semibold text-text-inverse disabled:opacity-50">{isBusy && state.busyKey === key ? "Saving…" : "Save owner review"}</button><button type="button" className={baseButton} disabled={isBusy} onClick={() => { setEditing(false); setLocalError(null); }}>Cancel</button></div>
      <p className="text-[11px] leading-5 text-text-muted">Your decision is an owner judgment, not independent verification of skill, qualification or job fit.</p>
    </div>}
    {state.ready && !option && <p className="mt-2 text-[11px] text-warning-text">This candidate is not currently reviewable. Refresh matches and reviews before saving a decision.</p>}
  </div>;
}

function PreviousReviewRow({ review, state }: { review: EvidenceReviewRecord; state: EvidenceReviewLedgerState }) {
  const [confirmRemoval, setConfirmRemoval] = useState(false);
  return <li className="rounded-md border border-border bg-surface-raised p-3">
    <div className="flex flex-wrap items-start justify-between gap-2"><Link href={`/armory/${encodeURIComponent(review.evidenceId)}`} className="text-[12px] font-semibold text-gold hover:underline">{review.evidenceTitleAtReview}</Link><span className="text-[10px] text-warning-text">{review.reviewStatus === "stale" ? "Stale" : "No longer displayed"}</span></div>
    <p className="mt-1 text-[11px] text-text-secondary">{reviewDecisionLabel(review.decision)}</p>
    <p className="mt-2 whitespace-pre-wrap break-words text-[11px] text-text-secondary">{review.note || "No explanation saved."}</p>
    {!confirmRemoval ? <button type="button" className={`mt-2 ${baseButton}`} disabled={state.loading || Boolean(state.busyKey) || state.unconfirmedWrite} onClick={() => setConfirmRemoval(true)}>Remove previous review</button> : <div className="mt-3 rounded-md border border-danger-border bg-danger-surface p-3">
      <p className="text-[11px] text-danger-text">Remove the earlier decision? This will not delete the Evidence record.</p>
      <div className="mt-2 flex flex-wrap gap-2"><button type="button" className={baseButton} disabled={state.loading || Boolean(state.busyKey) || state.unconfirmedWrite} onClick={() => void state.apply(review.requirementId, review.evidenceId, null).then((ok) => { if (ok) setConfirmRemoval(false); })}>Confirm removal</button><button type="button" className={baseButton} onClick={() => setConfirmRemoval(false)}>Cancel</button></div>
    </div>}
  </li>;
}

export function PreviousEvidenceReviews({
  requirement, state,
}: { requirement: EvidenceMatchRequirement; state: EvidenceReviewLedgerState }) {
  if (!state.ready) return null;
  const currentIds = new Set(requirement.evidenceCandidates.map((candidate) => candidate.id));
  const previous = state.reviews.filter((row) => row.requirementId === requirement.id && !currentIds.has(row.evidenceId));
  if (previous.length === 0) return null;
  return <div className="mt-6 rounded-lg border border-warning-border/60 bg-warning-surface/30 p-4">
    <p className="flex items-center gap-2 text-[12px] font-semibold text-text-primary"><AlertCircle aria-hidden="true" className="size-4 text-warning-text" /> Earlier owner decisions</p>
    <p className="mt-1 text-[11px] leading-5 text-text-secondary">These records are no longer displayed as current evidence candidates. Their decisions remain visible until removed; review actions cannot revalidate them without a current candidate match.</p>
    <ul className="mt-3 space-y-3">{previous.map((review) => <PreviousReviewRow key={review.id} review={review} state={state} />)}</ul>
  </div>;
}
