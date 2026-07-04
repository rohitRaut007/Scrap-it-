"use client";

import { useState } from "react";
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
        Log pickup
      </Button>
      <LogPickupDialog
        open={open}
        onOpenChange={setOpen}
        onLogged={(payoutInr) =>
          toast.success(
            payoutInr != null
              ? `Pickup logged · ${formatInr(payoutInr)}`
              : "Pickup logged",
          )
        }
      />
    </>
  );
}
