"use client";

import { useTranslations } from "next-intl";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  const t = useTranslations("common");
  return (
    <div className="rounded-2xl border border-dashed p-10 text-center">
      <WifiOff className="mx-auto h-9 w-9 text-muted-foreground/50" />
      <p className="mt-3 text-sm font-medium">{t("errorTitle")}</p>
      <p className="mx-auto mt-1 max-w-64 text-xs text-muted-foreground">
        {message ?? t("errorMessage")}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          {t("retry")}
        </Button>
      )}
    </div>
  );
}
