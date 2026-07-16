"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { NotebookPen, X } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useRateCard } from "@/hooks/use-portal";
import { collectorApi, ApiError } from "@/lib/api";
import { formatInr } from "@/lib/format";
import { revalidateCollectorData } from "@/lib/revalidate";
import { cn } from "@/lib/utils";

interface LogPickupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogged: (payoutInr: number | null) => void;
}

export function LogPickupDialog({
  open,
  onOpenChange,
  onLogged,
}: LogPickupDialogProps) {
  const t = useTranslations("logPickup");
  const tCommon = useTranslations("common");
  const { data: rateCard, isLoading: rateCardLoading } = useRateCard();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [addressText, setAddressText] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [weights, setWeights] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const selected = useMemo(
    () => (rateCard ?? []).filter((c) => selectedIds.includes(c.id)),
    [rateCard, selectedIds],
  );

  const lines = useMemo(
    () =>
      selected.map((c) => {
        const raw = weights[c.id] ?? "";
        const parsed = parseFloat(raw);
        const weightKg = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
        return { ...c, weightKg, linePayout: Math.round(weightKg * c.baseRateInr) };
      }),
    [selected, weights],
  );

  const totalPayout = lines.reduce((sum, l) => sum + l.linePayout, 0);
  const totalWeight = lines.reduce((sum, l) => sum + l.weightKg, 0);
  const hasWeight = lines.some((l) => l.weightKg > 0);
  const canSubmit = customerName.trim().length > 0 && hasWeight && !submitting;

  const toggleCategory = (id: string) => {
    setSelectedIds((ids) =>
      ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id],
    );
    setWeights((w) => {
      if (!(id in w)) return w;
      const next = { ...w };
      delete next[id];
      return next;
    });
  };

  const reset = () => {
    setCustomerName("");
    setCustomerPhone("");
    setAddressText("");
    setSelectedIds([]);
    setWeights({});
  };

  const handleSubmit = async () => {
    const items = lines
      .filter((l) => l.weightKg > 0)
      .map((l) => ({ categoryId: l.id, weightKg: l.weightKg }));
    if (items.length === 0 || customerName.trim().length === 0) return;

    setSubmitting(true);
    try {
      const created = await collectorApi.logPickup({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        addressText: addressText.trim() || undefined,
        items,
      });
      await revalidateCollectorData("earnings");
      onOpenChange(false);
      reset();
      onLogged(created.payoutInr);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : t("toastError"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (submitting) return;
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="flex max-h-[85dvh] flex-col gap-0 p-0 sm:max-w-md">
        <DialogHeader className="shrink-0 space-y-1 border-b px-5 py-4">
          <DialogTitle className="flex items-center gap-2">
            <NotebookPen className="h-5 w-5 text-primary" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable middle — everything else lives here */}
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="log-customer-name">{t("customerNameLabel")}</Label>
            <Input
              id="log-customer-name"
              placeholder={t("customerNamePlaceholder")}
              autoFocus
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              disabled={submitting}
              className="h-11"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="log-customer-phone">{t("phoneLabel")}</Label>
              <Input
                id="log-customer-phone"
                inputMode="tel"
                placeholder={t("phonePlaceholder")}
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                disabled={submitting}
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="log-address">{t("areaLabel")}</Label>
              <Input
                id="log-address"
                placeholder={t("areaPlaceholder")}
                value={addressText}
                onChange={(e) => setAddressText(e.target.value)}
                disabled={submitting}
                className="h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("whatCollected")}</Label>
            {rateCardLoading ? (
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-24 rounded-full" />
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(rateCard ?? []).map((c) => {
                  const isSelected = selectedIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCategory(c.id)}
                      disabled={submitting}
                      className={cn(
                        "rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                        isSelected
                          ? "border-rust bg-rust text-paper"
                          : "border-border bg-transparent text-foreground hover:border-rust/50",
                      )}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {selected.length > 0 && (
            <div className="space-y-2.5">
              <Label>{t("weightCollected")}</Label>
              {lines.map((line) => (
                <div
                  key={line.id}
                  className="flex items-center gap-3 rounded-xl border p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{line.name}</p>
                    <p className="text-xs text-muted-foreground">
                      ₹{line.baseRateInr}/kg
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.1"
                      placeholder="0.0"
                      autoFocus
                      className="h-11 w-24 text-right"
                      value={weights[line.id] ?? ""}
                      onChange={(e) =>
                        setWeights((w) => ({ ...w, [line.id]: e.target.value }))
                      }
                      disabled={submitting}
                    />
                    <span className="w-6 text-sm text-muted-foreground">kg</span>
                    <button
                      type="button"
                      onClick={() => toggleCategory(line.id)}
                      disabled={submitting}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={t("removeItem", { name: line.name })}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sticky footer — running total always visible, no scrolling to find it */}
        <DialogFooter className="shrink-0 flex-col gap-3 border-t px-5 py-4 sm:flex-col">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-muted-foreground">
              {totalWeight > 0
                ? t("kgTotal", { weight: Math.round(totalWeight * 100) / 100 })
                : t("pickupValue")}
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
              {tCommon("cancel")}
            </Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={!canSubmit}>
              {submitting ? t("saving") : t("save")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
