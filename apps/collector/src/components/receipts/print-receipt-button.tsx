"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Receipt as ReceiptIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrintReceiptDialog } from "@/components/receipts/print-receipt-dialog";
import type { CollectorOrder } from "@/lib/types";

interface PrintReceiptButtonProps {
  order: CollectorOrder;
  onReceiptNumberAssigned: (receiptNumber: number) => void;
}

export function PrintReceiptButton({
  order,
  onReceiptNumberAssigned,
}: PrintReceiptButtonProps) {
  const t = useTranslations("receipt");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" className="w-full gap-2" onClick={() => setOpen(true)}>
        <ReceiptIcon className="h-4 w-4" />
        {order.receiptNumber != null
          ? t("reprintButton", { number: order.receiptNumber })
          : t("printButton")}
      </Button>
      <PrintReceiptDialog
        order={order}
        open={open}
        onOpenChange={setOpen}
        onReceiptNumberAssigned={onReceiptNumberAssigned}
      />
    </>
  );
}
