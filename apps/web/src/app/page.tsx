"use client";

import { useEffect, useState } from "react";
import {
  Archive,
  Check,
  Circle,
  FileCheck2,
  LayoutDashboard,
  Menu,
  Plus,
  Settings2,
  ShieldCheck,
  X,
} from "lucide-react";

const evidenceItems = [
  {
    source: "Project",
    title: "Shodan Automation",
    description:
      "Automated recurring external exposure reporting using Python and Azure DevOps.",
    skills: ["Python", "Azure DevOps", "Security Automation"],
    date: "Jul 2026",
    verified: true,
  },
  {
    source: "Project",
    title: "Wayne Enterprises Endpoint Diagnostic",
    description:
      "Built a PowerShell diagnostic tool for Windows system health, networking, and security posture.",
    skills: ["PowerShell", "Windows", "Networking"],
    date: "Sep 2026",
    verified: true,
  },
  {
    source: "Project",
    title: "Project Hallows",
    description:
      "Designed a segmented cybersecurity homelab using OPNsense, VMware, Ubuntu, and firewall policy.",
    skills: ["Networking", "OPNsense", "Linux"],
    date: "Sep 2026",
    verified: true,
  },
];

const gettingStarted = [
  {
    label: "Continental initialized",
    complete: true,
  },
  {
    label: "Add first experience",
    complete: false,
  },
  {
    label: "Add first project",
    complete: false,
  },
  {
    label: "Attach evidence",
    complete: false,
  },
  {
    label: "Link evidence to a skill",
    complete: false,
  },
];

function BrandMark() {
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

function SidebarItem({
  icon: Icon,
  label,
  active = false,
  onSelect,
}: {
  icon: typeof LayoutDashboard;
  label: string;
  active?: boolean;
  onSelect?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "relative flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-[13px] font-medium transition-colors duration-150",
        active
          ? "bg-surface-raised text-text-primary"
          : "text-text-secondary hover:bg-surface-hover hover:text-text-primary",
      ].join(" ")}
    >
      {active ? (
        <span className="absolute bottom-2 left-0 top-2 w-px rounded-full bg-gold" />
      ) : null}

      <Icon
        aria-hidden="true"
        className={active ? "size-[17px] text-gold" : "size-[17px]"}
        strokeWidth={1.8}
      />

      <span>{label}</span>
    </button>
  );
}

function SidebarNavigation({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  return (
    <nav
      aria-label="Primary navigation"
      className="flex flex-1 flex-col px-3 py-4"
    >
      <div className="space-y-1">
        <SidebarItem
          icon={LayoutDashboard}
          label="Lobby"
          active
          onSelect={onNavigate}
        />
      </div>

      <div className="mt-auto">
        <SidebarItem
          icon={Settings2}
          label="Settings"
          onSelect={onNavigate}
        />
      </div>
    </nav>
  );
}

function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-[232px] flex-col border-r border-border-subtle bg-sidebar lg:flex">
      <div className="border-b border-border-subtle px-5 py-[18px]">
        <BrandMark />
      </div>

      <SidebarNavigation />

      <div className="border-t border-border-subtle px-5 py-4">
        <div className="flex items-center gap-2 text-[11px] text-text-muted">
          <span className="size-1.5 rounded-full bg-success" />
          <span>v0.0 · Foundation</span>
        </div>
      </div>
    </aside>
  );
}

function MobileNavigation({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close navigation"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <aside
        id="mobile-navigation"
        aria-label="Mobile navigation"
        className="absolute inset-y-0 left-0 flex w-[min(84vw,300px)] flex-col border-r border-border bg-sidebar shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-[18px]">
          <BrandMark />

          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-md text-text-muted transition-colors duration-150 hover:bg-surface-hover hover:text-text-primary"
          >
            <X
              aria-hidden="true"
              className="size-[18px]"
              strokeWidth={1.8}
            />
          </button>
        </div>

        <SidebarNavigation onNavigate={onClose} />

        <div className="border-t border-border-subtle px-5 py-4">
          <div className="flex items-center gap-2 text-[11px] text-text-muted">
            <span className="size-1.5 rounded-full bg-success" />
            <span>v0.0 · Foundation</span>
          </div>
        </div>
      </aside>
    </div>
  );
}

function ContextBar({
  mobileMenuOpen,
  onOpenMobileMenu,
}: {
  mobileMenuOpen: boolean;
  onOpenMobileMenu: () => void;
}) {
  return (
    <header className="sticky top-0 z-10 flex h-[52px] items-center border-b border-border-subtle bg-canvas/95 px-4 backdrop-blur-md sm:px-6 lg:ml-[232px] lg:px-8">
      <div className="flex w-full items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3 lg:hidden">
          <button
            type="button"
            aria-label="Open navigation"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            onClick={onOpenMobileMenu}
            className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-text-secondary transition-colors duration-150 hover:border-border-strong hover:bg-surface-hover hover:text-text-primary"
          >
            <Menu
              aria-hidden="true"
              className="size-[17px]"
              strokeWidth={1.8}
            />
          </button>

          <div className="min-w-0">
            <div className="truncate font-display text-[15px] font-semibold tracking-[0.06em] text-text-primary">
              THE CONTINENTAL
            </div>

            <div className="text-[10px] uppercase tracking-[0.15em] text-text-muted">
              Lobby
            </div>
          </div>
        </div>

        <div className="hidden min-w-0 items-center gap-2 text-[12px] text-text-muted lg:flex">
          <span className="font-medium text-text-secondary">
            The Continental
          </span>

          <span aria-hidden="true" className="text-border-strong">
            /
          </span>

          <span className="truncate">Lobby</span>
        </div>

        <div className="font-technical text-[10px] uppercase tracking-[0.1em] text-text-muted">
          v0.0
        </div>
      </div>
    </header>
  );
}

function EvidenceRow({
  source,
  title,
  description,
  skills,
  date,
  verified,
}: (typeof evidenceItems)[number]) {
  return (
    <article className="group border-b border-border-subtle px-4 py-4 transition-colors duration-150 last:border-b-0 hover:bg-surface-hover sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
            {source}
          </span>

          {verified ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success-text">
              <ShieldCheck
                aria-hidden="true"
                className="size-3.5"
                strokeWidth={1.8}
              />
              Verified
            </span>
          ) : null}
        </div>

        <span className="font-technical text-[11px] text-text-muted">
          {date}
        </span>
      </div>

      <h3 className="mt-1.5 text-[14px] font-semibold text-text-primary">
        {title}
      </h3>

      <p className="mt-1 max-w-3xl text-[13px] leading-5 text-text-secondary">
        {description}
      </p>

      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
        {skills.map((skill) => (
          <span
            key={skill}
            className="text-[11px] text-text-muted"
          >
            {skill}
          </span>
        ))}
      </div>
    </article>
  );
}

function CurrentFocus() {
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

function RecentEvidence() {
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
          <EvidenceRow key={item.title} {...item} />
        ))}
      </div>
    </section>
  );
}

function GettingStarted() {
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
          {gettingStarted.map((item) => (
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

function ProductRule() {
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

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-canvas text-text-primary">
      <Sidebar />

      <MobileNavigation
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <ContextBar
        mobileMenuOpen={mobileMenuOpen}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
      />

      <main className="lg:ml-[232px]">
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
                Build an inspectable record of what you have actually done,
                then use it to understand opportunities and decide what comes
                next.
              </p>
            </div>

            <button
              type="button"
              className="inline-flex h-9 w-fit shrink-0 items-center gap-2 rounded-md bg-gold px-3.5 text-[13px] font-semibold text-text-inverse transition-colors duration-150 hover:bg-gold-hover active:bg-gold-active"
            >
              <Plus
                aria-hidden="true"
                className="size-4"
              />
              Add Evidence
            </button>
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
      </main>
    </div>
  );
}