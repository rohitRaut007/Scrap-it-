"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Receipt as ReceiptIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReceiptPanel } from "@/components/receipts/receipt-panel";
import type { CollectorOrder } from "@/lib/types";

interface PrintReceiptDialogProps {
  order: CollectorOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReceiptNumberAssigned: (receiptNumber: number) => void;
}

export function PrintReceiptDialog({
  order,
  open,
  onOpenChange,
  onReceiptNumberAssigned,
}: PrintReceiptDialogProps) {
  const t = useTranslations("receipt");
  const [generating, setGenerating] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(o) => !generating && onOpenChange(o)}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ReceiptIcon className="h-5 w-5 text-primary" />
            {t("dialogTitle")}
          </DialogTitle>
          <DialogDescription>
            {order.receiptNumber != null
              ? t("receiptNoLabel", { number: order.receiptNumber })
              : null}
          </DialogDescription>
        </DialogHeader>

        {open && (
          <ReceiptPanel
            order={order}
            onReceiptNumberAssigned={onReceiptNumberAssigned}
            onGenerated={() => onOpenChange(false)}
            onGeneratingChange={setGenerating}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
