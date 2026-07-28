"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";

/** Shown alongside still-visible cached data when a background refresh
 * (e.g. polling) fails — distinct from ErrorState, which is for when there's
 * no data to show at all. Deliberately quiet: no toast per failed poll. */
export function StaleDataNotice() {
  const t = useTranslations("common");
  return (
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      {t("staleDataNotice")}
    </p>
  );
}
