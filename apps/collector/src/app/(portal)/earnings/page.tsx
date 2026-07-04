"use client";

import { IndianRupee, Package, Weight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EarningsChart } from "@/components/earnings/earnings-chart";
import { OrderCard } from "@/components/orders/order-card";
import { useEarnings } from "@/hooks/use-portal";
import { formatInr, formatWeight } from "@/lib/format";

export default function EarningsPage() {
  const { data, isLoading, error, mutate } = useEarnings(30);

  if (isLoading && !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Earnings</h1>
        <ErrorState onRetry={() => mutate()} />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold tracking-tight">Earnings</h1>

      {/* Period totals */}
      <div className="grid grid-cols-3 gap-3">
        <PeriodTile label="Today" value={formatInr(data.todayInr)} accent />
        <PeriodTile label="This week" value={formatInr(data.weekInr)} />
        <PeriodTile label="This month" value={formatInr(data.monthInr)} />
      </div>

      {/* Chart */}
      <div className="rounded-2xl border bg-card p-4 shadow-xs">
        <EarningsChart days={data.days} />
      </div>

      {/* Lifetime stats */}
      <div className="grid grid-cols-3 gap-3">
        <LifetimeTile
          icon={IndianRupee}
          label="Total earned"
          value={formatInr(data.totalInr)}
        />
        <LifetimeTile
          icon={Package}
          label="Pickups done"
          value={String(data.totalPickups)}
        />
        <LifetimeTile
          icon={Weight}
          label="Scrap collected"
          value={formatWeight(data.totalWeightKg)}
        />
      </div>

      {/* Recent completed pickups */}
      <div>
        <h2 className="mb-2.5 text-base font-semibold">Recent pickups</h2>
        {data.recentOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center">
            <Package className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-2 text-sm font-medium">No completed pickups yet</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Your earnings history will build up here as you complete pickups.
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
    </div>
  );
}

function PeriodTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={
        accent
          ? "rounded-2xl bg-cash p-3.5 text-paper shadow-md shadow-cash/20"
          : "rounded-2xl border bg-card p-3.5 shadow-xs"
      }
    >
      <p
        className={
          accent
            ? "font-mono text-[10px] uppercase tracking-[1.5px] text-paper/85"
            : "font-mono text-[10px] uppercase tracking-[1.5px] text-muted-foreground"
        }
      >
        {label}
      </p>
      <p className="mt-1 font-mono text-lg font-semibold leading-tight">{value}</p>
    </div>
  );
}

function LifetimeTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-3.5 shadow-xs">
      <Icon className="h-4 w-4 text-primary" />
      <p className="mt-2 font-mono text-base font-semibold leading-tight">{value}</p>
      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[1.5px] text-muted-foreground">{label}</p>
    </div>
  );
}
