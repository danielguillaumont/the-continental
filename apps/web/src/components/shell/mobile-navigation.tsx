import { X } from "lucide-react";

import { SidebarNavigation } from "@/components/shell/app-sidebar";
import { BrandMark } from "@/components/shell/brand-mark";

export function MobileNavigation({
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