"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { formatInr, weekdayShort } from "@/lib/format";
import type { EarningsDay } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * 14-day earnings bar chart. Single series (brand primary), CSS-only —
 * no chart library so it stays light on 3G/low-end devices.
 * Tap/click a bar to inspect its day; today is selected by default.
 */
export function EarningsChart({ days }: { days: EarningsDay[] }) {
  const t = useTranslations("earnings");
  const last14 = useMemo(() => days.slice(-14), [days]);
  const [selected, setSelected] = useState<number>(last14.length - 1);

  const max = Math.max(...last14.map((d) => d.amountInr), 1);
  const sel = last14[selected] ?? last14[last14.length - 1];

  return (
    <div>
      {/* Selected-day readout (tooltip equivalent for touch) */}
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <p className="text-xs text-muted-foreground">
            {sel
              ? new Date(`${sel.date}T00:00:00`).toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "short",
                })
              : "—"}
          </p>
          <p className="font-mono text-xl font-semibold">
            {formatInr(sel?.amountInr ?? 0)}
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {sel ? t("chartPickups", { count: sel.pickups }) : ""}
            </span>
          </p>
        </div>
        <p className="text-[11px] text-muted-foreground">{t("last14Days")}</p>
      </div>

      {/* Plot */}
      <div className="flex h-32 items-end gap-0.5" role="img" aria-label="Daily earnings, last 14 days">
        {last14.map((d, i) => {
          const h = d.amountInr === 0 ? 0 : Math.max((d.amountInr / max) * 100, 4);
          const isSelected = i === selected;
          return (
            <button
              key={d.date}
              type="button"
              onClick={() => setSelected(i)}
              aria-label={`${d.date}: ${formatInr(d.amountInr)}`}
              className="group flex h-full flex-1 flex-col items-center justify-end"
            >
              <div
                className={cn(
                  "w-full max-w-5 rounded-t-[4px] transition-all",
                  d.amountInr === 0
                    ? "h-0.5 rounded-none bg-border"
                    : isSelected
                      ? "bg-cash"
                      : "bg-cash/45 group-hover:bg-cash/70",
                )}
                style={d.amountInr === 0 ? undefined : { height: `${h}%` }}
              />
            </button>
          );
        })}
      </div>

      {/* Baseline + weekday ticks (every other day to avoid collisions) */}
      <div className="mt-1 border-t pt-1">
        <div className="flex gap-0.5">
          {last14.map((d, i) => (
            <span
              key={d.date}
              className={cn(
                "flex-1 text-center font-mono text-[9px] uppercase",
                i === selected ? "font-semibold text-foreground" : "text-muted-foreground",
              )}
            >
              {i % 2 === last14.length % 2 ? weekdayShort(d.date).slice(0, 2) : ""}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
