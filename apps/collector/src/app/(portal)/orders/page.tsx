"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Inbox, PackageCheck, Truck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { OrderCard } from "@/components/orders/order-card";
import { useAvailableOrders, useMyOrders } from "@/hooks/use-portal";
import { cn } from "@/lib/utils";
import type { OrderListResponse } from "@/lib/types";

const TABS = [
  { key: "new", label: "New" },
  { key: "active", label: "Active" },
  { key: "done", label: "Done" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function OrdersPage() {
  return (
    <Suspense fallback={<OrdersSkeleton />}>
      <OrdersContent />
    </Suspense>
  );
}

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: TabKey = TABS.some((t) => t.key === tabParam)
    ? (tabParam as TabKey)
    : "active";
  const [page, setPage] = useState(1);

  const available = useAvailableOrders(tab === "new" ? page : 1);
  const active = useMyOrders("active", tab === "active" ? page : 1);
  const history = useMyOrders("history", tab === "done" ? page : 1);

  const current =
    tab === "new" ? available : tab === "active" ? active : history;

  const setTab = (key: TabKey) => {
    setPage(1);
    router.replace(`/orders?tab=${key}`, { scroll: false });
  };

  const counts: Partial<Record<TabKey, number>> = {
    new: available.data?.total,
    active: active.data?.total,
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Pickups</h1>

      {/* Segmented tabs */}
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-secondary p-1">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all",
              tab === key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
            {counts[key] != null && counts[key]! > 0 && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                  key === "new"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary-foreground/10 text-muted-foreground",
                )}
              >
                {counts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      <OrdersList
        tab={tab}
        response={current.data}
        isLoading={current.isLoading}
        error={current.error}
        onRetry={() => current.mutate()}
      />

      {/* Pagination */}
      {current.data && current.data.total > current.data.pageSize && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {Math.ceil(current.data.total / current.data.pageSize)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= Math.ceil(current.data.total / current.data.pageSize)}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

function OrdersList({
  tab,
  response,
  isLoading,
  error,
  onRetry,
}: {
  tab: TabKey;
  response: OrderListResponse | undefined;
  isLoading: boolean;
  error?: unknown;
  onRetry: () => void;
}) {
  if (isLoading && !response) return <OrdersSkeleton />;

  if (error && !response) return <ErrorState onRetry={onRetry} />;

  if (!response || response.data.length === 0) {
    const empty = {
      new: {
        icon: Inbox,
        title: "No new pickups right now",
        hint: "New bookings in your area will show up here. Check back soon.",
      },
      active: {
        icon: Truck,
        title: "Nothing in progress",
        hint: "Accept a pickup from the New tab to get started.",
      },
      done: {
        icon: PackageCheck,
        title: "No completed pickups yet",
        hint: "Finished and cancelled pickups will appear here.",
      },
    }[tab];
    const Icon = empty.icon;
    return (
      <div className="rounded-2xl border border-dashed p-10 text-center">
        <Icon className="mx-auto h-9 w-9 text-muted-foreground/50" />
        <p className="mt-3 text-sm font-medium">{empty.title}</p>
        <p className="mx-auto mt-1 max-w-60 text-xs text-muted-foreground">
          {empty.hint}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {response.data.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}

function OrdersSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-40 rounded-2xl" />
    </div>
  );
}
