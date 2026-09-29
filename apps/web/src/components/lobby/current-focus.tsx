import { FileCheck2 } from "lucide-react";

export function CurrentFocus() {
  return (
    <section aria-labelledby="current-focus-heading">
      <div className="mb-3">
        <h2
          id="current-focus-heading"
          className="text-[15px] font-semibold text-text-primary"
        >
          Current focus
        </h2>

        <p className="mt-1 text-[12px] text-text-muted">
          Build the evidence foundation before adding intelligence.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="grid divide-y divide-border-subtle lg:grid-cols-[1.3fr_0.7fr] lg:divide-x lg:divide-y-0">
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">
              <FileCheck2
                aria-hidden="true"
                className="size-4"
              />
              Foundation
            </div>

            <h3 className="mt-4 max-w-xl text-[18px] font-semibold leading-6 text-text-primary">
              Establish a career evidence model that remains useful without AI.
            </h3>

            <p className="mt-2 max-w-2xl text-[13px] leading-5 text-text-secondary">
              The first useful version of The Continental starts with structured
              experience, projects, skills, and inspectable evidence.
            </p>
          </div>

          <div className="grid grid-cols-2 divide-x divide-border-subtle lg:grid-cols-1 lg:divide-x-0 lg:divide-y">
            <div className="p-5">
              <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-text-muted">
                Evidence
              </div>

              <div className="mt-2 text-[24px] font-semibold tracking-tight text-text-primary">
                3
              </div>

              <div className="mt-1 text-[12px] text-text-muted">
                seeded records
              </div>
            </div>

            <div className="p-5">
              <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-text-muted">
                Phase
              </div>

              <div className="mt-2 text-[14px] font-semibold text-text-primary">
                v0.0
              </div>

              <div className="mt-1 text-[12px] text-text-muted">
                visual foundation
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}