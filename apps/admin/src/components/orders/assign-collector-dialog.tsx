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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollectors } from "@/hooks/use-collectors";
import { adminApi, ApiError } from "@/lib/api";

interface AssignCollectorDialogProps {
  orderId: string;
  currentCollectorId?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AssignCollectorDialog({
  orderId,
  currentCollectorId,
  open,
  onOpenChange,
  onSuccess,
}: AssignCollectorDialogProps) {
  const [selectedId, setSelectedId] = useState(currentCollectorId ?? "");
  const [submitting, setSubmitting] = useState(false);
  const { data: collectorsData, isLoading: loadingCollectors } =
    useCollectors(open);

  const handleSubmit = async () => {
    if (!selectedId) return;
    setSubmitting(true);
    try {
      await adminApi.request(`/admin/orders/${orderId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectorId: selectedId }),
      });
      toast.success("Collector assigned successfully");
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Failed to assign collector";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const collectors = collectorsData?.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Collector</DialogTitle>
          <DialogDescription>
            Select a collector to handle this pickup order.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {loadingCollectors ? (
            <Skeleton className="h-9 w-full" />
          ) : collectors.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No collectors registered yet.
            </p>
          ) : (
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a collector…" />
              </SelectTrigger>
              <SelectContent>
                {collectors.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="font-medium">{c.name ?? c.email}</span>
                    {c.rating != null && (
                      <span className="ml-2 text-muted-foreground text-xs">
                        ★ {c.rating.toFixed(1)}
                      </span>
                    )}
                    {c.vehicleInfo && (
                      <span className="ml-2 text-muted-foreground text-xs">
                        · {c.vehicleInfo}
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            disabled={submitting || !selectedId || collectors.length === 0}
          >
            {submitting ? "Assigning…" : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
