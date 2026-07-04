"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { OrdersTable } from "@/components/orders/orders-table";
import { OrdersFilters } from "@/components/orders/orders-filters";
import { useOrders } from "@/hooks/use-orders";

const PAGE_SIZE = 20;

function OrdersPageInner() {
  const router = useRouter();
  const params = useSearchParams();

  const rawPage = Number(params.get("page") ?? 1);
  const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const status = params.get("status") ?? undefined;

  const { data, isLoading } = useOrders({ page, pageSize: PAGE_SIZE, status });

  const total = data?.total ?? 0;
  const hasNext = page * PAGE_SIZE < total;
  const hasPrev = page > 1;

  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  const goToPage = (p: number) => {
    const next = new URLSearchParams(params);
    next.set("page", String(p));
    router.push(`/orders?${next.toString()}`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <OrdersFilters />
      </div>

      <OrdersTable
        orders={data?.data ?? []}
        isLoading={isLoading}
        hasFilter={Boolean(status)}
      />

      {(hasPrev || hasNext || total > 0) && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            {total === 0
              ? "No orders"
              : `Showing ${start}–${end} of ${total} order${total !== 1 ? "s" : ""}`}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!hasPrev}
              onClick={() => goToPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasNext}
              onClick={() => goToPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense>
      <OrdersPageInner />
    </Suspense>
  );
}
