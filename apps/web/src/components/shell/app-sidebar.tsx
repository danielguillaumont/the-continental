import { LayoutDashboard, Settings2 } from "lucide-react";

import { BrandMark } from "@/components/shell/brand-mark";

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

export function SidebarNavigation({
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

export function AppSidebar() {
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