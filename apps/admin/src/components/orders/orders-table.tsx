"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import { formatRelative, isOrderOverdue } from "@/lib/order-utils";
import type { AdminOrderDto } from "@/hooks/use-orders";

interface OrdersTableProps {
  orders: AdminOrderDto[];
  isLoading: boolean;
  hasFilter?: boolean;
}

const ACTIVE_STATUSES = new Set(["scheduled", "assigned"]);

export function OrdersTable({ orders, isLoading, hasFilter }: OrdersTableProps) {
  const router = useRouter();

  const prevStatusMapRef = useRef<Map<string, string>>(new Map());
  const seenInitialDataRef = useRef(false);
  const [flashingIds, setFlashingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (orders.length === 0) return;

    const prev = prevStatusMapRef.current;

    if (!seenInitialDataRef.current) {
      seenInitialDataRef.current = true;
      orders.forEach((o) => prev.set(o.id, o.status));
      return;
    }

    const changed: string[] = [];
    orders.forEach((o) => {
      const prevStatus = prev.get(o.id);
      if (prevStatus !== undefined && prevStatus !== o.status) {
        changed.push(o.id);
      }
      prev.set(o.id, o.status);
    });

    if (changed.length === 0) return;

    setFlashingIds((ids) => new Set([...ids, ...changed]));

    const timer = setTimeout(() => {
      setFlashingIds((ids) => {
        const next = new Set(ids);
        changed.forEach((id) => next.delete(id));
        return next;
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [orders]);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden sm:table-cell">
              Scheduled ↓
            </TableHead>
            <TableHead className="hidden md:table-cell">Collector</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading &&
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 5 }).map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}

          {!isLoading && orders.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                {hasFilter
                  ? "No orders match the selected filter."
                  : "No orders yet."}
              </TableCell>
            </TableRow>
          )}

          {!isLoading &&
            orders.map((order) => {
              const overdue =
                ACTIVE_STATUSES.has(order.status) && isOrderOverdue(order.scheduledAt);
              return (
                <TableRow
                  key={order.id}
                  className={`cursor-pointer hover:bg-muted/50${flashingIds.has(order.id) ? " animate-row-flash" : ""}`}
                  onClick={() => router.push(`/orders/${order.id}`)}
                >
                  <TableCell>
                    <div className="font-medium text-sm">
                      {order.customerName ?? order.customerEmail}
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {order.id.slice(0, 8)}…
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-1.5">
                      {overdue && (
                        <AlertTriangle
                          size={13}
                          className="text-warning shrink-0"
                          aria-label="Overdue"
                        />
                      )}
                      <span className={`text-sm${overdue ? " text-warning font-medium" : ""}`}>
                        {formatRelative(order.scheduledAt)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {order.collectorInfo ? (
                      <span className="text-sm">{order.collectorInfo.name ?? "—"}</span>
                    ) : (
                      <span className="text-sm italic text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/orders/${order.id}`);
                      }}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </div>
  );
}
