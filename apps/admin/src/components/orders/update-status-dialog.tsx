"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  validNextStatuses,
  orderStatusLabel,
  type OrderStatus,
} from "@/lib/order-utils";
import { adminApi, ApiError } from "@/lib/api";

interface UpdateStatusDialogProps {
  orderId: string;
  currentStatus: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function UpdateStatusDialog({
  orderId,
  currentStatus,
  open,
  onOpenChange,
  onSuccess,
}: UpdateStatusDialogProps) {
  const nextStatuses = validNextStatuses(currentStatus as OrderStatus);
  const [selectedStatus, setSelectedStatus] = useState<string>(nextStatuses[0] ?? "");
  const [totalWeightKg, setTotalWeightKg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isCompleting = selectedStatus === "completed";

  const handleSubmit = async () => {
    if (!selectedStatus) return;
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { status: selectedStatus };
      if (isCompleting && totalWeightKg) {
        body.totalWeightKg = parseFloat(totalWeightKg);
      }
      await adminApi.request(`/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      toast.success(`Order status updated to "${orderStatusLabel(selectedStatus as OrderStatus)}"`);
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      // Show backend's descriptive message verbatim for 422 errors
      const msg =
        err instanceof ApiError ? err.message : "Failed to update status";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Order Status</DialogTitle>
          <DialogDescription>
            Advance the order through its lifecycle.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>New status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status…" />
              </SelectTrigger>
              <SelectContent>
                {nextStatuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {orderStatusLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isCompleting && (
            <div className="space-y-1.5">
              <Label htmlFor="weight">
                Total weight (kg){" "}
                <span className="text-muted-foreground font-normal">
                  — optional
                </span>
              </Label>
              <Input
                id="weight"
                type="number"
                min={0}
                max={10000}
                step={0.1}
                placeholder="e.g. 12.5"
                value={totalWeightKg}
                onChange={(e) => setTotalWeightKg(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !selectedStatus}
          >
            {submitting ? "Updating…" : "Update status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
