"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LogPickupDialog } from "@/components/orders/log-pickup-dialog";
import { formatInr } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Entry point for the manual "Log a Pickup" flow — the primary CTA for
 * digitizing a collector's existing (off-app) business, so it should be
 * reachable from both the dashboard and the pickups tabs.
 */
export function LogPickupButton({
  className,
  variant = "outline",
}: {
  className?: string;
  variant?: "default" | "outline";
}) {
  const t = useTranslations("orders");
  const tLog = useTranslations("logPickup");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        size="sm"
        variant={variant}
        className={cn("gap-1.5", className)}
        onClick={() => setOpen(true)}
      >
        <Plus className="h-4 w-4" />
        {t("logPickup")}
      </Button>
      <LogPickupDialog
        open={open}
        onOpenChange={setOpen}
        onLogged={(payoutInr) =>
          toast.success(
            payoutInr != null
              ? tLog("toastLoggedAmount", { amount: formatInr(payoutInr) })
              : tLog("toastLogged"),
          )
        }
      />
    </>
  );
}
