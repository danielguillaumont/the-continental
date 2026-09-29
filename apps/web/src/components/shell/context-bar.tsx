import { Menu } from "lucide-react";

export function ContextBar({
  sectionLabel,
  mobileMenuOpen,
  onOpenMobileMenu,
}: {
  sectionLabel: string;
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

            <div className="truncate text-[10px] uppercase tracking-[0.15em] text-text-muted">
              {sectionLabel}
            </div>
          </div>
        </div>

        <div className="hidden min-w-0 items-center gap-2 text-[12px] text-text-muted lg:flex">
          <span className="font-medium text-text-secondary">
            The Continental
          </span>

          <span
            aria-hidden="true"
            className="text-border-strong"
          >
            /
          </span>

          <span className="truncate">{sectionLabel}</span>
        </div>

        <div className="font-technical text-[10px] uppercase tracking-[0.1em] text-text-muted">
          v0.1
        </div>
      </div>
    </header>
  );
}