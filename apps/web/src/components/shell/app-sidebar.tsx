"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseBusiness, FolderKanban, LayoutDashboard, LibraryBig, type LucideIcon } from "lucide-react";

import { BrandMark } from "@/components/shell/brand-mark";
import { activeDestination, destinations, type Destination } from "@/lib/primary-navigation";

function SidebarItem({
  icon: Icon,
  destination,
  active,
  onSelect,
}: {
  icon: LucideIcon;
  destination: Destination;
  active: boolean;
  onSelect?: () => void;
}) {
  const item = destinations[destination];
  return (
    <Link
      href={item.href}
      onClick={onSelect}
      aria-current={active ? "page" : undefined}
      className={[
        "relative flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-gold",
        active
          ? "bg-surface-active text-text-primary"
          : "text-text-secondary hover:bg-surface-hover hover:text-text-primary",
      ].join(" ")}
    >
      {active && <span aria-hidden="true" className="absolute inset-y-2.5 left-0 w-[2px] rounded-full bg-gold" />}
      <Icon aria-hidden="true" className={active ? "size-[18px] shrink-0 text-gold" : "size-[18px] shrink-0"} strokeWidth={1.8} />
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold">{item.label}</span>
        <span className="mt-0.5 block text-[11px] leading-4 text-text-muted">{item.description}</span>
      </span>
    </Link>
  );
}

export function SidebarNavigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = activeDestination(pathname);
  return (
    <nav aria-label="Primary navigation" className="flex flex-1 flex-col px-3 py-5">
      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">Workspace</p>
      <SidebarItem icon={LayoutDashboard} destination="overview" active={active === "overview"} onSelect={onNavigate} />
      <p className="mb-2 mt-6 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">Your career record</p>
      <div className="space-y-1">
        <SidebarItem icon={BriefcaseBusiness} destination="experiences" active={active === "experiences"} onSelect={onNavigate} />
        <SidebarItem icon={FolderKanban} destination="projects" active={active === "projects"} onSelect={onNavigate} />
        <SidebarItem icon={LibraryBig} destination="evidence" active={active === "evidence"} onSelect={onNavigate} />
      </div>
      <p className="mt-5 border-t border-border-subtle px-3 pt-4 text-[11px] leading-5 text-text-muted">
        Experience tracks the roles. Projects show what you built. Evidence is the reusable proof.
      </p>
    </nav>
  );
}

export function AppSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-[232px] flex-col border-r border-border-subtle bg-sidebar lg:flex">
      <div className="border-b border-border-subtle px-5 py-[18px]"><BrandMark /></div>
      <SidebarNavigation />
      <div className="border-t border-border-subtle px-5 py-4">
        <div className="flex items-center gap-2 text-[11px] text-text-muted">
          <span className="size-1.5 rounded-full bg-success" />
          <span>v0.1 · Career record foundation</span>
        </div>
      </div>
    </aside>
  );
}
