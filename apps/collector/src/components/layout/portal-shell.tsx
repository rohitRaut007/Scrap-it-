"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Home,
  Package,
  FileText,
  User,
  Recycle,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { DoubleRule } from "@/components/ui/double-rule";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { PortalRateTicker } from "@/components/layout/portal-rate-ticker";
import { useSummary } from "@/hooks/use-portal";

interface PortalShellProps {
  userEmail?: string;
  children: React.ReactNode;
}

export function PortalShell({ userEmail, children }: PortalShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const { data: summary } = useSummary();

  const NAV_ITEMS = [
    {
      href: "/dashboard",
      label: t("dashboard"),
      subtitle: t("dashboardSubtitle"),
      icon: Home,
    },
    {
      href: "/orders",
      label: t("orders"),
      subtitle: t("ordersSubtitle"),
      icon: Package,
      badge: summary?.availableOrders,
    },
    {
      href: "/invoices",
      label: t("invoices"),
      subtitle: t("invoicesSubtitle"),
      icon: FileText,
    },
    {
      href: "/profile",
      label: t("profile"),
      subtitle: t("profileSubtitle"),
      icon: User,
    },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-dvh bg-background">
      <PortalRateTicker />
      <div className="md:flex">
        {/* Desktop sidebar — a newspaper masthead + front-page index */}
        <aside className="hidden md:sticky md:top-0 md:flex md:h-dvh md:w-72 md:shrink-0 md:flex-col md:overflow-y-auto md:border-r md:bg-sidebar">
          {/* Masthead */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-primary text-primary-foreground shadow-hard-ink-sm">
                <Recycle className="h-5.5 w-5.5" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-2xl leading-none tracking-tight">
                  {t("brand")}
                </p>
                <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground italic">
                  {t("tagline")}
                </p>
              </div>
            </div>
          </div>
          <DoubleRule className="mx-6" />

          {/* Dateline */}
          <div className="flex justify-between px-6 py-3 font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase">
            <span>{t("portalName")}</span>
            <span>
              {new Date().toLocaleDateString("en-IN", {
                weekday: "short",
                day: "2-digit",
                month: "short",
              })}
            </span>
          </div>

          <div className="px-6 pb-1.5">
            <div className="flex items-baseline justify-between border-b border-ink pb-2">
              <span className="font-mono text-[10px] font-semibold tracking-[0.2em] text-foreground uppercase">
                {t("navIndexLabel")}
              </span>
              <span className="font-mono text-[9px] tracking-wider text-muted-foreground uppercase">
                {t("navSectionsLabel")}
              </span>
            </div>
          </div>

          {/* Index nav */}
          <nav className="flex-1 px-3 pt-1">
            {NAV_ITEMS.map(({ href, label, subtitle, badge }, i) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-baseline gap-3 border-l-[3px] px-3 py-2.5 transition-colors",
                    active
                      ? "border-rust bg-background"
                      : "border-transparent hover:bg-background/60",
                  )}
                >
                  <span
                    className={cn(
                      "font-mono text-[11px] font-semibold tracking-wide",
                      active ? "text-rust" : "text-muted-foreground",
                    )}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg leading-none">{label}</p>
                    <p className="mt-1 flex items-center gap-1.5 font-mono text-[9px] tracking-wider text-muted-foreground uppercase">
                      {subtitle}
                      {!!badge && badge > 0 && (
                        <span className="rounded-xs bg-rust px-1 py-px font-mono text-[9px] font-semibold text-primary-foreground normal-case">
                          {badge}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    p.{String(i + 1).padStart(2, "0")}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-6 pt-2 pb-5">
            <DoubleRule className="mb-3" />
            <p className="mb-2 truncate font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
              {userEmail}
            </p>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <Button
                variant="ghost"
                className="flex-1 justify-start gap-2.5 text-muted-foreground"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                {tCommon("logout")}
              </Button>
            </div>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Mobile header */}
          <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-card/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Recycle className="h-4 w-4" />
              </div>
              <p className="text-sm font-bold leading-tight">{t("brand")}</p>
            </div>
            <LanguageSwitcher />
          </header>

          <main className="mx-auto w-full max-w-2xl px-4 pt-4 pb-24 md:max-w-6xl md:px-10 md:py-8">
            {children}
          </main>
        </div>

        {/* Mobile bottom navigation */}
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:hidden pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto grid max-w-md grid-cols-4">
            {NAV_ITEMS.map(({ href, label, icon: Icon, badge }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <span className="relative">
                    <Icon
                      className={cn("h-5 w-5", active && "fill-primary/15")}
                      strokeWidth={active ? 2.4 : 2}
                    />
                    {!!badge && badge > 0 && (
                      <span className="absolute -top-1 -right-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-rust px-0.5 font-mono text-[8px] font-semibold text-primary-foreground">
                        {badge}
                      </span>
                    )}
                  </span>
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
