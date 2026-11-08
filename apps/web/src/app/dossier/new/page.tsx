"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FilePlus2 } from "lucide-react";
import { OpportunityForm } from "@/components/dossier/opportunity-form";
import { AppShell } from "@/components/shell/app-shell";
import { dossierUrl } from "@/lib/dossier-workspace";

export default function NewDossierPage() {
  const router = useRouter();
  return <AppShell sectionLabel="Dossier / New opportunity">
    <div className="mx-auto w-full max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <Link href="/dossier" className="inline-flex min-h-10 items-center gap-2 text-[13px] font-semibold text-text-secondary hover:text-gold"><ArrowLeft className="size-4" />Opportunity registry</Link>
      <header className="mb-8 mt-5 border-b border-border-subtle pb-7">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold"><FilePlus2 className="size-4" /> Dossier / Intake</p>
        <h1 className="mt-2 font-display text-[38px] leading-tight text-text-primary sm:text-[44px]">Open a new dossier.</h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-6 text-text-secondary">Save a job posting and record its details without claiming to have analyzed it. Add requirements after creating the record.</p>
      </header>
      <OpportunityForm onCancel={() => router.push("/dossier")} onSaved={(saved) => router.push(dossierUrl(saved.id))} />
    </div>
  </AppShell>;
}
