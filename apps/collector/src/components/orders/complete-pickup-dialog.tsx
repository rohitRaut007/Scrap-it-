"use client";

import { useMemo, useState } from "react";
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
  const [weights, setWeights] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const lines = useMemo(
    () =>
      order.categories.map((c) => {
        const raw = weights[c.categoryId] ?? "";
        const parsed = parseFloat(raw);
        const weightKg = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
        return {
          ...c,
          weightKg,
          linePayout: Math.round(weightKg * c.baseRateInr),
        };
      }),
    [order.categories, weights],
  );

  const totalPayout = lines.reduce((sum, l) => sum + l.linePayout, 0);
  const totalWeight = lines.reduce((sum, l) => sum + l.weightKg, 0);
  const hasWeight = lines.some((l) => l.weightKg > 0);

  const handleSubmit = async () => {
    const items = lines
      .filter((l) => l.weightKg > 0)
      .map((l) => ({ categoryId: l.categoryId, weightKg: l.weightKg }));
    if (items.length === 0) return;

    setSubmitting(true);
    try {
      const updated = await collectorApi.complete(order.id, items);
      await revalidateCollectorData("earnings");
      onOpenChange(false);
      onCompleted(updated.payoutInr);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not complete the pickup.",
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
            Weigh &amp; complete
          </DialogTitle>
          <DialogDescription>
            Enter the weight for each material. The customer payout is
            calculated at today&apos;s platform rates.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {order.categories.length === 0 && (
            <p className="rounded-lg bg-signal/20 p-3 text-sm text-ink">
              This booking has no materials listed. Contact support if the
              customer has scrap to weigh.
            </p>
          )}
          {lines.map((line) => (
            <div
              key={line.categoryId}
              className="flex items-center gap-3 rounded-xl border p-3"
            >
              <div className="flex-1 min-w-0">
                <Label
                  htmlFor={`w-${line.categoryId}`}
                  className="text-sm font-medium"
                >
                  {line.name}
                </Label>
                <p className="text-xs text-muted-foreground">
                  ₹{line.baseRateInr}/kg
                </p>
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
          ))}
        </div>

        {/* Sticky footer — running total always visible, no scrolling to find it */}
        <DialogFooter className="shrink-0 flex-col gap-3 border-t px-5 py-4 sm:flex-col">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-muted-foreground">
              {totalWeight > 0 ? `${Math.round(totalWeight * 100) / 100} kg total` : "Customer payout"}
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
              Back
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={!hasWeight || submitting}
            >
              {submitting ? "Completing…" : "Complete"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
