"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Home,
  Package,
  IndianRupee,
  User,
  Recycle,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

interface PortalShellProps {
  userEmail?: string;
  children: React.ReactNode;
}

export function PortalShell({ userEmail, children }: PortalShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");

  const NAV_ITEMS = [
    { href: "/dashboard", label: t("dashboard"), icon: Home },
    { href: "/orders", label: t("orders"), icon: Package },
    { href: "/earnings", label: t("earnings"), icon: IndianRupee },
    { href: "/profile", label: t("profile"), icon: User },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-dvh bg-background md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:bg-sidebar md:sticky md:top-0 md:h-dvh shrink-0">
        <div className="flex items-center gap-2.5 px-5 h-16 border-b">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Recycle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">{t("brand")}</p>
            <p className="text-[11px] text-muted-foreground leading-tight">
              {t("portalName")}
            </p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="h-4.5 w-4.5" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t p-3">
          <div className="flex items-center justify-between gap-2 px-3 pb-2">
            <p className="truncate text-xs text-muted-foreground">
              {userEmail}
            </p>
            <LanguageSwitcher />
          </div>
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
          <LanguageSwitcher />
        </header>

        <main className="mx-auto w-full max-w-2xl px-4 pt-4 pb-24 md:px-8 md:py-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:hidden pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon
                  className={cn("h-5 w-5", active && "fill-primary/15")}
                  strokeWidth={active ? 2.4 : 2}
                />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
