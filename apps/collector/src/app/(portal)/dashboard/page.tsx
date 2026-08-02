"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  BellRing,
  CalendarCheck,
  IndianRupee,
  Package,
  Star,
  TrendingUp,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { StaleDataNotice } from "@/components/ui/stale-data-notice";
import { SectionEyebrow } from "@/components/ui/section-eyebrow";
import { OrderCard } from "@/components/orders/order-card";
import { LogPickupButton } from "@/components/orders/log-pickup-button";
import { EarningsSection } from "@/components/earnings/earnings-section";
import { RecentPickupsSection } from "@/components/earnings/recent-pickups-section";
import { useProfile, useSummary } from "@/hooks/use-portal";
import { firstName, formatInr } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const { data: summary, isLoading, error, mutate } = useSummary();
  const { data: profile } = useProfile();

  const greeting = (): string => {
    const h = new Date().getHours();
    if (h < 12) return t("greetingMorning");
    if (h < 17) return t("greetingAfternoon");
    return t("greetingEvening");
  };

  const dateline = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <SectionEyebrow label={t("frontPageLabel")} dateline={dateline} />

      {/* Greeting */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-4xl leading-[0.95] tracking-tight md:text-5xl">
            {greeting()}, {firstName(profile?.name)}.
          </h1>
          {summary && (
            <p className="mt-2 text-sm text-muted-foreground italic">
              {summary.availableOrders > 0
                ? t("subheadAvailable", { count: summary.availableOrders })
                : t("subheadNone")}
            </p>
          )}
        </div>
        <LogPickupButton
          variant="default"
          className="mt-1 shrink-0 shadow-hard-ink"
        />
      </div>

      {error && !summary && <ErrorState onRetry={() => mutate()} />}
      {error && summary && <StaleDataNotice />}

      {/* Today's earnings hero */}
      {isLoading || !summary ? (
        <Skeleton className="h-40 rounded-3xl" />
      ) : (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cash to-[#153f2b] p-6 text-paper shadow-elevation-hero">
          <div className="pointer-events-none absolute -right-10 -top-12 h-48 w-48 rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.18),transparent_70%)]" />
          <div className="pointer-events-none absolute -right-20 top-16 h-40 w-40 rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.10),transparent_70%)]" />
          <p className="relative font-mono text-xs font-semibold uppercase tracking-[0.2em] text-paper/85">
            {t("todayEarnings")}
          </p>
          <p className="relative mt-1.5 truncate font-display text-4xl leading-[0.9] tracking-tight sm:text-5xl md:text-6xl">
            {formatInr(summary.todayEarningsInr)}
          </p>
          <div className="relative mt-4 flex flex-col items-start gap-2 text-sm text-paper/90 sm:flex-row sm:flex-wrap sm:items-center">
            <span className="flex max-w-full items-center gap-1.5 truncate rounded-full bg-white/10 px-2.5 py-1">
              <Package className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {t("pickupsDone", { count: summary.todayCompleted })}
              </span>
            </span>
            <span className="flex max-w-full items-center gap-1.5 truncate rounded-full bg-white/10 px-2.5 py-1">
              <TrendingUp className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {t("weekEarnings", { amount: formatInr(summary.weekEarningsInr) })}
              </span>
            </span>
          </div>
        </div>
      )}

      {/* Available orders banner */}
      {summary && summary.availableOrders > 0 && (
        <Link
          href="/orders?tab=new"
          className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 shadow-elevation-1 transition-shadow hover:bg-primary/10 hover:shadow-elevation-2"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <BellRing className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">
              {t("newPickupsAvailable", { count: summary.availableOrders })}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("acceptBeforeOther")}
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-primary shrink-0" />
        </Link>
      )}

      {/* At a Glance */}
      <div>
        <p className="mb-2 font-mono text-xs font-semibold tracking-[0.2em] text-rust uppercase">
          {t("atAGlanceLabel")}
        </p>
        {isLoading || !summary ? (
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              icon={IndianRupee}
              label={t("statThisMonth")}
              value={formatInr(summary.monthEarningsInr)}
              accent="rust"
            />
            <StatCard
              icon={CalendarCheck}
              label={t("statTotalPickups")}
              value={String(summary.totalCompleted)}
              accent="ink"
            />
            <StatCard
              icon={Star}
              label={t("statRating")}
              value={
                summary.rating != null ? summary.rating.toFixed(1) : tCommon("new")
              }
              accent="signal"
            />
          </div>
        )}
      </div>

      {/* Next pickup */}
      <div>
        <div className="mb-2.5 flex items-baseline justify-between">
          <h2 className="font-mono text-xs font-semibold tracking-[0.2em] text-rust uppercase">
            {summary && summary.activeOrders > 1
              ? t("nextPickupActive", { count: summary.activeOrders })
              : t("nextPickup")}
          </h2>
          <Link
            href="/orders"
            className="text-sm font-medium text-primary hover:underline"
          >
            {t("seeAll")}
          </Link>
        </div>

        {isLoading ? (
          <Skeleton className="h-40 rounded-2xl" />
        ) : summary?.nextOrder ? (
          <OrderCard order={summary.nextOrder} />
        ) : (
          <div className="rounded-2xl border bg-card/50 p-8 text-center shadow-elevation-1">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
              <Package className="h-6 w-6 text-muted-foreground/70" />
            </div>
            <p className="mt-3 text-sm font-medium">{t("noActivePickups")}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {summary && summary.availableOrders > 0
                ? t("noActivePickupsHintAvailable")
                : t("noActivePickupsHint")}
            </p>
            {summary && summary.availableOrders > 0 && (
              <Link
                href="/orders?tab=new"
                className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
              >
                {t("browseAvailable")}
              </Link>
            )}
          </div>
        )}
      </div>

      <RecentPickupsSection />

      <div className="border-t border-rule pt-5">
        <EarningsSection />
      </div>
    </div>
  );
}

const STAT_ACCENT_CLASSES = {
  rust: "bg-rust/10 text-rust",
  ink: "bg-ink/10 text-ink",
  signal: "bg-signal/15 text-signal",
} as const;

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent: keyof typeof STAT_ACCENT_CLASSES;
}) {
  return (
    <div className="min-w-0 rounded-2xl border bg-card p-3.5 shadow-elevation-1 transition-shadow hover:shadow-elevation-2">
      <div
        className={cn(
          "flex size-8 items-center justify-center rounded-full",
          STAT_ACCENT_CLASSES[accent],
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-2.5 truncate font-display text-2xl leading-none tracking-tight sm:text-3xl">
        {value}
      </p>
      <p className="mt-1.5 truncate font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase">
        {label}
      </p>
    </div>
  );
}
