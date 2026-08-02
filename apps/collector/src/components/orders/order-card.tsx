"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Camera, ChevronRight, Clock, MapPin, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/orders/status-badge";
import { collectorApi, ApiError } from "@/lib/api";
import { formatInr, formatScheduledAt, formatWeight } from "@/lib/format";
import { revalidateCollectorData } from "@/lib/revalidate";
import type { CollectorOrder } from "@/lib/types";
import { cn } from "@/lib/utils";

interface OrderCardProps {
  order: CollectorOrder;
}

export function OrderCard({ order }: OrderCardProps) {
  const router = useRouter();
  const t = useTranslations("orders");
  const [accepting, setAccepting] = useState(false);

  const isDone = order.status === "completed" || order.status === "cancelled";

  const handleAccept = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAccepting(true);
    try {
      await collectorApi.accept(order.id);
      toast.success(t("toastAccepted"));
      await revalidateCollectorData();
      router.push(`/orders/${order.id}`);
    } catch (err) {
      toast.error(
        err instanceof ApiError && err.status === 409
          ? t("toastAcceptFailedTaken")
          : t("toastAcceptFailedGeneric"),
      );
      await revalidateCollectorData();
    } finally {
      setAccepting(false);
    }
  };

  return (
    <Link
      href={`/orders/${order.id}`}
      className={cn(
        "block rounded-2xl border border-ink/15 bg-card p-4 shadow-elevation-1 transition-shadow",
        "hover:border-ink/30 hover:shadow-elevation-2 active:scale-[0.99]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 font-mono text-sm font-semibold">
          <Clock className="h-4 w-4 text-primary shrink-0" />
          {formatScheduledAt(order.scheduledAt)}
        </div>
        {isDone && order.payoutInr != null ? (
          <div className="flex items-center gap-1.5">
            {order.source === "manual" && (
              <span className="rounded-xs bg-muted px-1.5 py-0.5 font-mono text-[9px] font-medium tracking-wide text-muted-foreground uppercase">
                {t("loggedBadge")}
              </span>
            )}
            <span className="font-mono text-sm font-semibold text-cash">
              {formatInr(order.payoutInr)}
            </span>
          </div>
        ) : (
          <StatusBadge status={order.status} />
        )}
      </div>

      <div className="mt-2.5 flex items-start gap-2 text-sm text-muted-foreground">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
        <span className="line-clamp-2">{order.addressLine}</span>
      </div>

      {order.categories.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {order.categories.map((c) => (
            <span
              key={c.categoryId}
              className="rounded-full border border-ink/20 px-2.5 py-1 font-mono text-[11px] font-medium"
            >
              {c.name}
              <span className="ml-1 text-muted-foreground">{c.rateLabel}</span>
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {order.customerName && <span>{order.customerName}</span>}
          {order.photoUrls.length > 0 && (
            <span className="flex items-center gap-1">
              <Camera className="h-3.5 w-3.5" />
              {order.photoUrls.length}
            </span>
          )}
          {order.notes && (
            <span className="flex items-center gap-1">
              <StickyNote className="h-3.5 w-3.5" />
              {t("note")}
            </span>
          )}
          {isDone && order.totalWeightKg != null && (
            <span className="font-mono">{formatWeight(order.totalWeightKg)}</span>
          )}
        </div>

        {order.isAvailable ? (
          <Button
            size="xl"
            className="rounded-full font-semibold shadow-hard-ink-sm"
            onClick={handleAccept}
            disabled={accepting}
          >
            {accepting ? t("accepting") : t("accept")}
          </Button>
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </div>
    </Link>
  );
}
