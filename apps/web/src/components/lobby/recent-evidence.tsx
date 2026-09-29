import { EvidenceRow } from "@/components/evidence/evidence-row";
import { evidenceItems } from "@/data/lobby";

export function RecentEvidence() {
  return (
    <section aria-labelledby="recent-evidence-heading">
      <div className="mb-3">
        <h2
          id="recent-evidence-heading"
          className="text-[15px] font-semibold text-text-primary"
        >
          Recent evidence
        </h2>

        <p className="mt-1 text-[12px] text-text-muted">
          Inspectable proof behind skills and career claims.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        {evidenceItems.map((item) => (
          <EvidenceRow
            key={item.title}
            {...item}
          />
        ))}
      </div>
    </section>
  );
}