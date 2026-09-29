import { Check, Circle } from "lucide-react";

import { gettingStartedItems } from "@/data/lobby";

export function GettingStarted() {
  return (
    <section aria-labelledby="getting-started-heading">
      <div className="mb-3">
        <h2
          id="getting-started-heading"
          className="text-[15px] font-semibold text-text-primary"
        >
          Getting started
        </h2>

        <p className="mt-1 text-[12px] text-text-muted">
          Build enough structure for The Continental to understand your work.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-surface">
        <div className="divide-y divide-border-subtle">
          {gettingStartedItems.map((item) => (
            <div
              key={item.label}
              className="flex min-h-11 items-center gap-3 px-4 py-2.5 sm:px-5"
            >
              <div
                className={[
                  "flex size-5 shrink-0 items-center justify-center rounded-full border",
                  item.complete
                    ? "border-success-border bg-success-surface text-success-text"
                    : "border-border-strong bg-surface-raised text-text-muted",
                ].join(" ")}
              >
                {item.complete ? (
                  <Check
                    aria-hidden="true"
                    className="size-3"
                    strokeWidth={2}
                  />
                ) : (
                  <Circle
                    aria-hidden="true"
                    className="size-2"
                    fill="currentColor"
                    strokeWidth={0}
                  />
                )}
              </div>

              <span
                className={[
                  "min-w-0 flex-1 text-[13px]",
                  item.complete
                    ? "text-text-secondary"
                    : "text-text-primary",
                ].join(" ")}
              >
                {item.label}
              </span>

              <span className="shrink-0 text-[10px] font-medium uppercase tracking-[0.1em] text-text-muted">
                {item.complete ? "Done" : "Pending"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}