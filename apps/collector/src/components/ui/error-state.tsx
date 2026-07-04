"use client";

import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorState({
  message = "Could not reach the server. Check your connection and try again.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed p-10 text-center">
      <WifiOff className="mx-auto h-9 w-9 text-muted-foreground/50" />
      <p className="mt-3 text-sm font-medium">Something went wrong</p>
      <p className="mx-auto mt-1 max-w-64 text-xs text-muted-foreground">
        {message}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
