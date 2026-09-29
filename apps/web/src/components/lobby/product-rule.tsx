import { Archive } from "lucide-react";

export function ProductRule() {
  return (
    <section className="rounded-lg border border-border-subtle bg-sidebar p-5">
      <div className="flex items-center gap-2">
        <Archive
          aria-hidden="true"
          className="size-4 text-gold"
          strokeWidth={1.8}
        />

        <h2 className="text-[13px] font-semibold text-text-primary">
          Product rule
        </h2>
      </div>

      <p className="mt-3 text-[12px] leading-5 text-text-secondary">
        Evidence before generation. If The Continental says you know something,
        it should be able to show why.
      </p>

      <div className="mt-4 border-t border-border-subtle pt-3 font-technical text-[10px] uppercase tracking-[0.1em] text-text-muted">
        v0.0 · Foundation
      </div>
    </section>
  );
}