"use client";

import { useTranslations } from "next-intl";
import { Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { OrderCard } from "@/components/orders/order-card";
import { useEarnings } from "@/hooks/use-portal";

/** Recent completed pickups — grouped with "Next pickup" so all pickup
 * activity (upcoming + just-completed) reads as one continuous flow, rather
 * than being buried below the earnings chart/analytics further down. */
export function RecentPickupsSection() {
  const t = useTranslations("earnings");
  const { data, isLoading, error, mutate } = useEarnings(14);

  if (isLoading && !data) {
    return (
      <div className="space-y-2.5">
        <Skeleton className="h-5 w-32" />
        <div className="space-y-3">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-2.5">
        <h2 className="font-mono text-xs font-semibold tracking-[0.2em] text-rust uppercase">
          {t("recentPickups")}
        </h2>
        <ErrorState onRetry={() => mutate()} />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      <h2 className="mb-2.5 font-mono text-xs font-semibold tracking-[0.2em] text-rust uppercase">
        {t("recentPickups")}
      </h2>
      {data.recentOrders.length === 0 ? (
        <div className="rounded-2xl border bg-card/50 p-8 text-center shadow-elevation-1">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
            <Package className="h-6 w-6 text-muted-foreground/70" />
          </div>
          <p className="mt-3 text-sm font-medium">{t("noCompletedTitle")}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("noCompletedHint")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.recentOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
