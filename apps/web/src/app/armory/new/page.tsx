import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { EvidenceForm } from "@/components/evidence/evidence-form";
import { AppShell } from "@/components/shell/app-shell";

export default function NewEvidencePage() {
  return (
    <AppShell sectionLabel="Armory">
      <div className="mx-auto w-full max-w-[1100px] px-4 py-7 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="border-b border-border-subtle pb-7">
          <Link
            href="/armory"
            className="inline-flex items-center gap-2 text-[12px] font-medium text-text-muted transition-colors duration-150 hover:text-text-primary"
          >
            <ArrowLeft
              aria-hidden="true"
              className="size-4"
              strokeWidth={1.8}
            />
            Back to Armory
          </Link>

          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.15em] text-gold">
            Armory / New Evidence
          </p>

          <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-text-primary sm:text-[24px]">
            Add evidence.
          </h1>

          <p className="mt-2 max-w-2xl text-[13px] leading-5 text-text-secondary">
            Capture a real project, experience, certification, education item,
            or artifact that can support future career claims.
          </p>
        </div>

        <div className="py-7">
          <EvidenceForm />
        </div>
      </div>
    </AppShell>
  );
}