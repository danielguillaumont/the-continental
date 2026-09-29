export function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-gold-muted bg-gold-surface text-gold">
        <span className="font-display text-[19px] font-semibold leading-none">
          C
        </span>
      </div>

      <div className="min-w-0">
        <div className="font-display text-[17px] font-semibold tracking-[0.08em] text-text-primary">
          THE CONTINENTAL
        </div>

        <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted">
          Career Intelligence
        </div>
      </div>
    </div>
  );
}