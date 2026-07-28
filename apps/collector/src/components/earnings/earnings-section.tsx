"use client";

import { useTranslations } from "next-intl";
import { IndianRupee, Package, Weight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EarningsChart } from "@/components/earnings/earnings-chart";
import { useEarnings } from "@/hooks/use-portal";
import { formatInr, formatWeight } from "@/lib/format";

/** Chart + lifetime stats — the analytical "how am I trending" block.
 * Today/this week/this month are intentionally NOT repeated here — the
 * dashboard hero and quick stats above this section already show those
 * three numbers. Recent completed pickups live in RecentPickupsSection,
 * grouped with "Next pickup" instead of down here. */
export function EarningsSection() {
  const t = useTranslations("earnings");
  const { data, isLoading, error, mutate } = useEarnings(14);

  if (isLoading && !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-4">
        <h2 className="text-base font-semibold">{t("title")}</h2>
        <ErrorState onRetry={() => mutate()} />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-5">
      <h2 className="text-base font-semibold">{t("title")}</h2>

      {/* Chart */}
      <div className="rounded-2xl border bg-card p-4 shadow-elevation-1">
        <EarningsChart days={data.days} />
      </div>

      {/* Lifetime stats */}
      <div className="grid grid-cols-3 gap-3">
        <LifetimeTile
          icon={IndianRupee}
          label={t("totalEarned")}
          value={formatInr(data.totalInr)}
          accent="cash"
        />
        <LifetimeTile
          icon={Package}
          label={t("pickupsDone")}
          value={String(data.totalPickups)}
          accent="rust"
        />
        <LifetimeTile
          icon={Weight}
          label={t("scrapCollected")}
          value={formatWeight(data.totalWeightKg)}
          accent="signal"
        />
      </div>
    </div>
  );
}

const LIFETIME_ACCENT_CLASSES = {
  cash: "bg-cash/10 text-cash",
  rust: "bg-rust/10 text-rust",
  signal: "bg-signal/15 text-signal",
} as const;

function LifetimeTile({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent: keyof typeof LIFETIME_ACCENT_CLASSES;
}) {
  return (
    <div className="rounded-2xl border bg-card p-3.5 shadow-elevation-1 transition-shadow hover:shadow-elevation-2">
      <div
        className={`flex size-8 items-center justify-center rounded-full ${LIFETIME_ACCENT_CLASSES[accent]}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-2.5 font-mono text-base font-semibold leading-tight">{value}</p>
      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[1.5px] text-muted-foreground">{label}</p>
    </div>
  );
}
