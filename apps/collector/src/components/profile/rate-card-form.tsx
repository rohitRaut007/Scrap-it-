"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useRateCard } from "@/hooks/use-portal";
import { collectorApi, ApiError } from "@/lib/api";

export function RateCardForm() {
  const t = useTranslations("rateCard");
  const { data: rateCard, isLoading, error, mutate } = useRateCard();
  const [rates, setRates] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!rateCard) return;
    setRates((prev) => {
      const next = { ...prev };
      for (const item of rateCard) {
        if (!(item.id in next)) {
          next[item.id] = item.rateInrPerKg != null ? String(item.rateInrPerKg) : "";
        }
      }
      return next;
    });
  }, [rateCard]);

  const handleSave = async () => {
    const items = Object.entries(rates)
      .map(([categoryId, raw]) => ({ categoryId, rateInrPerKg: parseFloat(raw) }))
      .filter((i) => Number.isFinite(i.rateInrPerKg) && i.rateInrPerKg >= 0);
    if (items.length === 0) return;

    setSaving(true);
    try {
      await collectorApi.updateRateCard(items);
      await mutate();
      toast.success(t("toastSaved"));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("toastError"));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading && !rateCard) {
    return (
      <div className="space-y-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error && !rateCard) {
    return <ErrorState onRetry={() => mutate()} />;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t("description")}</p>
      <div className="space-y-2.5">
        {(rateCard ?? []).map((item) => {
          const raw = rates[item.id] ?? "";
          const isSet = raw.trim() !== "" && Number.isFinite(parseFloat(raw));
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl border p-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{item.name}</p>
                {!isSet && (
                  <p className="text-xs text-signal">{t("notSetYet")}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor={`rate-${item.id}`} className="sr-only">
                  {item.name}
                </Label>
                <span className="text-sm text-muted-foreground">₹</span>
                <Input
                  id={`rate-${item.id}`}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.5"
                  placeholder="0"
                  className="h-11 w-24 text-right"
                  value={raw}
                  onChange={(e) =>
                    setRates((r) => ({ ...r, [item.id]: e.target.value }))
                  }
                  disabled={saving}
                />
                <span className="text-sm text-muted-foreground">{t("perKg")}</span>
              </div>
            </div>
          );
        })}
      </div>
      <Button className="w-full" onClick={handleSave} disabled={saving}>
        {saving ? t("saving") : t("save")}
      </Button>
    </div>
  );
}
