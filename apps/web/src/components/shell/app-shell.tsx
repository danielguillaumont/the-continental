"use client";

import { useEffect, useState, type ReactNode } from "react";

import { AppSidebar } from "@/components/shell/app-sidebar";
import { ContextBar } from "@/components/shell/context-bar";
import { MobileNavigation } from "@/components/shell/mobile-navigation";

export function AppShell({
  children,
}: {
  children: ReactNode;
}) {
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
      <AppSidebar />

      <MobileNavigation
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <ContextBar
        mobileMenuOpen={mobileMenuOpen}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
      />

      <main className="lg:ml-[232px]">{children}</main>
    </div>
  );
}