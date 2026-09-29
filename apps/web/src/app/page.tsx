import Link from "next/link";
import { LibraryBig } from "lucide-react";

import { CurrentFocus } from "@/components/lobby/current-focus";
import { GettingStarted } from "@/components/lobby/getting-started";
import { ProductRule } from "@/components/lobby/product-rule";
import { RecentEvidence } from "@/components/lobby/recent-evidence";
import { AppShell } from "@/components/shell/app-shell";

export default function Home() {
  return (
    <AppShell sectionLabel="Lobby">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-7 sm:px-6 sm:py-8 lg:px-8 lg:py-10 xl:px-10">
        <div className="mb-8 flex flex-col gap-5 border-b border-border-subtle pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold">
              Lobby
            </p>

            <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-text-primary sm:text-[24px]">
              Your career intelligence workspace.
            </h1>

            <p className="mt-2 max-w-2xl text-[13px] leading-5 text-text-secondary">
              Build an inspectable record of what you have actually done, then
              use it to understand opportunities and decide what comes next.
            </p>
          </div>

          <Link
            href="/armory"
            className="inline-flex h-9 w-fit shrink-0 items-center gap-2 rounded-md bg-gold px-3.5 text-[13px] font-semibold text-text-inverse transition-colors duration-150 hover:bg-gold-hover active:bg-gold-active"
          >
            <LibraryBig
              aria-hidden="true"
              className="size-4"
            />
            Open Armory
          </Link>
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