"use client";

import Link from "next/link";
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
import { OrderCard } from "@/components/orders/order-card";
import { useProfile, useSummary } from "@/hooks/use-portal";
import { firstName, formatInr } from "@/lib/format";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { data: summary, isLoading, error, mutate } = useSummary();
  const { data: profile } = useProfile();

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting()}, {firstName(profile?.name)}
        </h1>
      </div>

      {error && !summary && <ErrorState onRetry={() => mutate()} />}

      {/* Today's earnings hero */}
      {isLoading || !summary ? (
        <Skeleton className="h-36 rounded-3xl" />
      ) : (
        <div className="relative overflow-hidden rounded-3xl bg-cash p-6 text-paper shadow-lg shadow-cash/20">
          <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -right-16 top-10 h-40 w-40 rounded-full bg-white/5" />
          <p className="font-mono text-xs uppercase tracking-[1.5px] text-paper/85">
            Today&apos;s earnings
          </p>
          <p className="mt-1 font-display text-4xl tracking-tight">
            {formatInr(summary.todayEarningsInr)}
          </p>
          <div className="mt-3 flex items-center gap-4 text-sm text-paper/85">
            <span className="flex items-center gap-1.5">
              <Package className="h-4 w-4" />
              {summary.todayCompleted} pickup{summary.todayCompleted === 1 ? "" : "s"} done
            </span>
            <span className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" />
              {formatInr(summary.weekEarningsInr)} this week
            </span>
          </div>
        </div>
      )}

      {/* Available orders banner */}
      {summary && summary.availableOrders > 0 && (
        <Link
          href="/orders?tab=new"
          className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 transition-colors hover:bg-primary/10"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <BellRing className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">
              {summary.availableOrders} new pickup
              {summary.availableOrders === 1 ? "" : "s"} available
            </p>
            <p className="text-xs text-muted-foreground">
              Accept before another collector does
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-primary shrink-0" />
        </Link>
      )}

      {/* Quick stats */}
      {isLoading || !summary ? (
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <StatTile
            icon={IndianRupee}
            label="This month"
            value={formatInr(summary.monthEarningsInr)}
          />
          <StatTile
            icon={CalendarCheck}
            label="Total pickups"
            value={String(summary.totalCompleted)}
          />
          <StatTile
            icon={Star}
            label="Rating"
            value={summary.rating != null ? summary.rating.toFixed(1) : "New"}
          />
        </div>
      )}

      {/* Next pickup */}
      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="text-base font-semibold">
            {summary && summary.activeOrders > 0
              ? `Your next pickup${summary.activeOrders > 1 ? ` (${summary.activeOrders} active)` : ""}`
              : "Your next pickup"}
          </h2>
          <Link
            href="/orders"
            className="text-sm font-medium text-primary hover:underline"
          >
            See all
          </Link>
        </div>

        {isLoading ? (
          <Skeleton className="h-40 rounded-2xl" />
        ) : summary?.nextOrder ? (
          <OrderCard order={summary.nextOrder} />
        ) : (
          <div className="rounded-2xl border border-dashed p-8 text-center">
            <Package className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-2 text-sm font-medium">No active pickups</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {summary && summary.availableOrders > 0
                ? "New pickups are waiting in the feed."
                : "New bookings in your area will appear here."}
            </p>
            {summary && summary.availableOrders > 0 && (
              <Link
                href="/orders?tab=new"
                className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
              >
                Browse available pickups →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatTile({
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
      <p className="mt-2 font-mono text-lg font-semibold leading-tight">{value}</p>
      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[1.5px] text-muted-foreground">{label}</p>
    </div>
  );
}
