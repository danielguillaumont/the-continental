import Link from "next/link";
import { FolderKanban, LibraryBig } from "lucide-react";

import { CurrentFocus } from "@/components/lobby/current-focus";
import { GettingStarted } from "@/components/lobby/getting-started";
import { ProductRule } from "@/components/lobby/product-rule";
import { RecentEvidence } from "@/components/lobby/recent-evidence";
import { AppShell } from "@/components/shell/app-shell";

export default function Home() {
  return (
    <AppShell sectionLabel="Overview">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-7 sm:px-6 sm:py-8 lg:px-8 lg:py-10 xl:px-10">
        <div className="mb-8 flex flex-col gap-5 border-b border-border-subtle pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold">
              Overview
            </p>

            <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-text-primary sm:text-[24px]">
              Your career, backed by real work.
            </h1>

            <p className="mt-2 max-w-2xl text-[13px] leading-5 text-text-secondary">
              Keep your projects and their supporting evidence connected. Start with the
              work you built, then attach records that demonstrate what you did.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link href="/armory/projects" className="inline-flex min-h-10 items-center gap-2 rounded-md bg-gold px-4 text-[13px] font-semibold text-text-inverse transition-colors hover:bg-gold-hover">
              <FolderKanban aria-hidden="true" className="size-4" /> View projects
            </Link>
            <Link href="/armory" className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border px-4 text-[13px] font-semibold text-text-primary transition-colors hover:border-gold">
              <LibraryBig aria-hidden="true" className="size-4" /> Browse evidence
            </Link>
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-8">
            <CurrentFocus />
            <RecentEvidence />
          </div>

          <aside className="min-w-0 space-y-8">
            <GettingStarted />
            <ProductRule />
          </aside>
        </div>
      </div>
    </AppShell>
  );
}