"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Scale } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRateCard } from "@/hooks/use-portal";
import { collectorApi, ApiError } from "@/lib/api";
import { formatInr } from "@/lib/format";
import { revalidateCollectorData } from "@/lib/revalidate";
import type { CollectorOrder } from "@/lib/types";

interface CompletePickupDialogProps {
  order: CollectorOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted: (payoutInr: number | null) => void;
}

export function CompletePickupDialog({
  order,
  open,
  onOpenChange,
  onCompleted,
}: CompletePickupDialogProps) {
  const t = useTranslations("completePickup");
  const { data: rateCard } = useRateCard();
  const [weights, setWeights] = useState<Record<string, string>>({});
  const [rates, setRates] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const rateByCategory = useMemo(
    () => new Map((rateCard ?? []).map((r) => [r.id, r.rateInrPerKg])),
    [rateCard],
  );

  const lines = useMemo(
    () =>
      order.categories.map((c) => {
        const rawWeight = weights[c.categoryId] ?? "";
        const parsedWeight = parseFloat(rawWeight);
        const weightKg =
          Number.isFinite(parsedWeight) && parsedWeight > 0 ? parsedWeight : 0;
        const savedRate = rateByCategory.get(c.categoryId) ?? null;
        const rawRate = rates[c.categoryId] ?? (savedRate != null ? String(savedRate) : "");
        const parsedRate = parseFloat(rawRate);
        const rateInrPerKg = Number.isFinite(parsedRate) && parsedRate >= 0 ? parsedRate : null;
        return {
          ...c,
          weightKg,
          rateInrPerKg,
          rawRate,
          linePayout: rateInrPerKg != null ? Math.round(weightKg * rateInrPerKg) : 0,
        };
      }),
    [order.categories, weights, rates, rateByCategory],
  );

  const totalPayout = lines.reduce((sum, l) => sum + l.linePayout, 0);
  const totalWeight = lines.reduce((sum, l) => sum + l.weightKg, 0);
  const hasWeight = lines.some((l) => l.weightKg > 0 && l.rateInrPerKg != null);

  const handleSubmit = async () => {
    const items = lines
      .filter((l) => l.weightKg > 0 && l.rateInrPerKg != null)
      .map((l) => ({
        categoryId: l.categoryId,
        weightKg: l.weightKg,
        rateInrPerKg: l.rateInrPerKg!,
      }));
    if (items.length === 0) return;

    setSubmitting(true);
    try {
      const updated = await collectorApi.complete(order.id, items);
      await revalidateCollectorData("earnings");
      onOpenChange(false);
      onCompleted(updated.payoutInr);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : t("toastError"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent className="flex max-h-[85dvh] flex-col gap-0 p-0 sm:max-w-md">
        <DialogHeader className="shrink-0 space-y-1 border-b px-5 py-4">
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {order.categories.length === 0 && (
            <p className="rounded-lg bg-signal/20 p-3 text-sm text-ink">
              {t("noMaterials")}
            </p>
          )}
          {lines.map((line) => (
            <div key={line.categoryId} className="rounded-xl border p-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <Label
                    htmlFor={`w-${line.categoryId}`}
                    className="text-sm font-medium"
                  >
                    {line.name}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    id={`w-${line.categoryId}`}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.1"
                    placeholder="0.0"
                    className="h-11 w-24 text-right"
                    value={weights[line.categoryId] ?? ""}
                    onChange={(e) =>
                      setWeights((w) => ({
                        ...w,
                        [line.categoryId]: e.target.value,
                      }))
                    }
                    disabled={submitting}
                  />
                  <span className="w-6 text-sm text-muted-foreground">kg</span>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">₹</span>
                <Input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.5"
                  placeholder={t("ratePlaceholder")}
                  className="h-9 w-24 text-right text-xs"
                  value={line.rawRate}
                  onChange={(e) =>
                    setRates((r) => ({ ...r, [line.categoryId]: e.target.value }))
                  }
                  disabled={submitting}
                />
                <span className="text-xs text-muted-foreground">{t("perKg")}</span>
                {line.rateInrPerKg == null && (
                  <Link
                    href="/profile/rate-card"
                    className="ml-auto text-xs font-medium text-primary underline"
                  >
                    {t("setRateLink")}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Sticky footer — running total always visible, no scrolling to find it */}
        <DialogFooter className="shrink-0 flex-col gap-3 border-t px-5 py-4 sm:flex-col">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-muted-foreground">
              {totalWeight > 0
                ? t("kgTotal", { weight: Math.round(totalWeight * 100) / 100 })
                : t("customerPayout")}
            </p>
            <p className="font-mono text-lg font-semibold text-cash">
              {formatInr(totalPayout)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              {t("back")}
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={!hasWeight || submitting}
            >
              {submitting ? t("completing") : t("complete")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
