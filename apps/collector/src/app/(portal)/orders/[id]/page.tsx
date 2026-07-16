"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  IndianRupee,
  MapPin,
  MessageCircle,
  Navigation,
  PartyPopper,
  Phone,
  StickyNote,
  User,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/orders/status-badge";
import { StatusStepper } from "@/components/orders/status-stepper";
import { CompletePickupDialog } from "@/components/orders/complete-pickup-dialog";
import { useOrder } from "@/hooks/use-portal";
import { collectorApi, ApiError } from "@/lib/api";
import {
  formatInr,
  formatScheduledAt,
  formatWeight,
} from "@/lib/format";
import { nextAction } from "@/lib/order-utils";
import { revalidateCollectorData } from "@/lib/revalidate";

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const t = useTranslations("orders");
  const { data: order, isLoading, mutate } = useOrder(id);
  const [busy, setBusy] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [celebratedPayout, setCelebratedPayout] = useState<number | null>(null);

  const runAction = async (fn: () => Promise<unknown>, successMsg?: string) => {
    setBusy(true);
    try {
      await fn();
      await Promise.all([mutate(), revalidateCollectorData()]);
      if (successMsg) toast.success(successMsg);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("toastGenericError"));
      await mutate();
    } finally {
      setBusy(false);
    }
  };

  if (isLoading && !order) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-2xl border border-dashed p-10 text-center">
        <XCircle className="mx-auto h-9 w-9 text-muted-foreground/50" />
        <p className="mt-3 text-sm font-medium">{t("notFoundTitle")}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("notFoundHint")}
        </p>
        <Button variant="outline" size="sm" className="mt-4" asChild>
          <Link href="/orders">{t("backToPickups")}</Link>
        </Button>
      </div>
    );
  }

  const action = nextAction(order.status, order.isAvailable);
  const actionLabel = action ? t(action.actionKey) : null;
  const mapsUrl =
    order.latitude != null && order.longitude != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${order.latitude},${order.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.addressLine)}`;

  const handlePrimary = () => {
    if (!action) return;
    if (action.next === "assigned") {
      return runAction(
        () => collectorApi.accept(order.id),
        t("toastAccepted"),
      );
    }
    if (action.next === "en_route") {
      return runAction(
        () => collectorApi.updateStatus(order.id, "en_route"),
        t("toastEnRoute"),
      );
    }
    if (action.next === "arriving") {
      return runAction(
        () => collectorApi.updateStatus(order.id, "arriving"),
        t("toastArriving"),
      );
    }
    setCompleteOpen(true);
  };

  const handleDecline = () =>
    runAction(async () => {
      await collectorApi.decline(order.id);
      router.push("/orders?tab=new");
    }, t("toastDeclined"));

  return (
    <div className="space-y-4 pb-24 md:pb-0">
      {/* Back + status */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="-ml-2 gap-1.5" asChild>
          <Link href="/orders">
            <ArrowLeft className="h-4 w-4" />
            {t("title")}
          </Link>
        </Button>
        <StatusBadge status={order.status} />
      </div>

      {/* Completed banner */}
      {(order.status === "completed" || celebratedPayout != null) && (
        <div className="rounded-2xl border border-cash/25 bg-cash/10 p-5 text-center">
          <PartyPopper className="mx-auto h-7 w-7 text-cash" />
          <p className="mt-2 text-sm font-medium text-cash">
            {t("completedBannerTitle")}
          </p>
          <p className="font-mono text-2xl font-semibold text-cash">
            {formatInr(celebratedPayout ?? order.payoutInr)}
          </p>
          <p className="mt-0.5 text-xs text-ink-soft">
            {t("completedBannerSubtitle", {
              weight: formatWeight(order.totalWeightKg),
            })}
          </p>
        </div>
      )}

      {/* Schedule + stepper */}
      <div className="rounded-2xl border bg-card p-4 shadow-xs">
        <p className="text-lg font-bold">{formatScheduledAt(order.scheduledAt)}</p>
        {order.status !== "cancelled" && order.status !== "scheduled" && (
          <div className="mt-4">
            <StatusStepper status={order.status} />
          </div>
        )}
        {order.status === "cancelled" && (
          <p className="mt-1 text-sm text-muted-foreground">
            {t("cancelledNotice")}
          </p>
        )}
      </div>

      {/* Customer */}
      <div className="rounded-2xl border bg-card p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold">{order.customerName ?? t("customerFallback")}</p>
            <p className="text-xs text-muted-foreground">
              {order.customerPhone ?? t("phoneHidden")}
            </p>
          </div>
          {order.customerPhone && (
            <div className="flex gap-2">
              <Button size="icon" variant="outline" className="rounded-full" asChild>
                <a href={`tel:${order.customerPhone.replace(/\s/g, "")}`} aria-label={t("callCustomer")}>
                  <Phone className="h-4 w-4" />
                </a>
              </Button>
              <Button size="icon" variant="outline" className="rounded-full" asChild>
                <a
                  href={`https://wa.me/${order.customerPhone.replace(/[^\d]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("whatsappCustomer")}
                >
                  <MessageCircle className="h-4 w-4" />
                </a>
              </Button>
            </div>
          )}
        </div>

        <Separator className="my-3.5" />

        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="flex-1 text-sm">{order.addressLine}</p>
        </div>
        {order.city && (
          <Button variant="secondary" className="mt-3 w-full gap-2" asChild>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <Navigation className="h-4 w-4" />
              {t("openInMaps")}
            </a>
          </Button>
        )}
      </div>

      {/* Materials */}
      <div className="rounded-2xl border bg-card p-4 shadow-xs">
        <h2 className="text-sm font-semibold">{t("materials")}</h2>
        {order.categories.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {t("noMaterials")}
          </p>
        ) : (
          <div className="mt-2 divide-y">
            {order.categories.map((c) => (
              <div key={c.categoryId} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.rateInrPerKg != null ? `₹${c.rateInrPerKg}/kg` : c.rateLabel}
                  </p>
                </div>
                {c.weightKg != null ? (
                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold text-cash">{formatInr(c.payoutInr)}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {formatWeight(c.weightKg)}
                    </p>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {t("weighAtPickup")}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        {order.status === "completed" && order.payoutInr != null && (
          <>
            <Separator className="my-2" />
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm font-semibold">{t("totalPaid")}</span>
              <span className="font-mono text-base font-semibold text-cash">
                {formatInr(order.payoutInr)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="rounded-2xl border bg-card p-4 shadow-xs">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <StickyNote className="h-4 w-4 text-primary" />
            {t("customerNote")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{order.notes}</p>
        </div>
      )}

      {/* Photos */}
      {order.photoUrls.length > 0 && (
        <div className="rounded-2xl border bg-card p-4 shadow-xs">
          <h2 className="text-sm font-semibold">{t("scrapPhotos")}</h2>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {order.photoUrls.map((url, i) => (
              <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={t("scrapPhotoAlt", { index: i + 1 })}
                  className="aspect-square w-full rounded-xl border object-cover"
                  loading="lazy"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Action bar */}
      {action && (
        <div className="fixed inset-x-0 bottom-16 z-30 border-t bg-card/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-card/85 md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
          <div className="mx-auto flex max-w-2xl gap-2.5 px-1 md:px-0">
            {order.status === "assigned" && (
              <Button
                variant="outline"
                className="h-12 flex-none px-4 text-muted-foreground"
                onClick={handleDecline}
                disabled={busy}
              >
                {t("decline")}
              </Button>
            )}
            <Button
              className="h-12 flex-1 gap-2 text-base font-semibold"
              onClick={handlePrimary}
              disabled={busy}
            >
              {action.next === "completed" && <IndianRupee className="h-4.5 w-4.5" />}
              {busy ? t("working") : actionLabel}
            </Button>
          </div>
        </div>
      )}

      <CompletePickupDialog
        order={order}
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        onCompleted={(payout) => {
          setCelebratedPayout(payout);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    </div>
  );
}
