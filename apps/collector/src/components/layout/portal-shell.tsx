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
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { PortalRateTicker } from "@/components/layout/portal-rate-ticker";
import { useSummary } from "@/hooks/use-portal";
import { buildWhatsAppUrl, SUPPORT_WHATSAPP_NUMBER } from "@/lib/whatsapp";

interface PortalShellProps {
  userEmail?: string;
  children: React.ReactNode;
}

export function PortalShell({ userEmail, children }: PortalShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  // Live counts only matter while dwelling on Dashboard/Orders — everywhere
  // else the badge still loads once on mount (and updates via the existing
  // revalidateCollectorData() after accept/decline), it just doesn't poll.
  const shouldPollSummary = pathname === "/dashboard" || pathname === "/orders";
  const { data: summary } = useSummary(shouldPollSummary);

  const NAV_ITEMS = [
    {
      href: "/dashboard",
      label: t("dashboard"),
      icon: Home,
    },
    {
      href: "/orders",
      label: t("orders"),
      icon: Package,
      badge: summary?.availableOrders,
    },
    {
      href: "/invoices",
      label: t("invoices"),
      icon: FileText,
    },
    {
      href: "/profile",
      label: t("profile"),
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
        {/* Desktop sidebar */}
        <aside className="hidden md:sticky md:top-0 md:flex md:h-dvh md:w-64 md:shrink-0 md:flex-col md:overflow-y-auto md:border-r md:bg-sidebar">
          <div className="flex h-16 items-center gap-2.5 border-b px-5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Recycle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight">
                {t("brand")}
              </p>
              <p className="truncate text-[11px] leading-tight text-muted-foreground">
                {t("portalName")}
              </p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 p-3">
            {NAV_ITEMS.map(({ href, label, icon: Icon, badge }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  <span className="flex-1 truncate">{label}</span>
                  {!!badge && badge > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rust px-1 font-mono text-[10px] font-semibold text-primary-foreground">
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t p-3">
            <div className="flex items-center justify-between gap-2 px-3 pb-2">
              <p className="truncate text-xs text-muted-foreground">
                {userEmail}
              </p>
              <LanguageSwitcher />
            </div>
            <a
              href={buildWhatsAppUrl(SUPPORT_WHATSAPP_NUMBER)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <MessageCircle className="h-4 w-4 shrink-0" />
              {t("support")}
            </a>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              {tCommon("logout")}
            </Button>
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
            <div className="flex items-center gap-1">
              <a
                href={buildWhatsAppUrl(SUPPORT_WHATSAPP_NUMBER)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("support")}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground"
              >
                <MessageCircle className="h-4.5 w-4.5" />
              </a>
              <LanguageSwitcher />
            </div>
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
