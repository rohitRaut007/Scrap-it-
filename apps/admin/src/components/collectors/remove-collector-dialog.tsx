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
import { updateCollectorStatus, type CollectorAdminDto } from "@/hooks/use-collectors";
import { ApiError } from "@/lib/api";

interface RemoveCollectorDialogProps {
  collector: CollectorAdminDto | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RemoveCollectorDialog({
  collector,
  onOpenChange,
  onSuccess,
}: RemoveCollectorDialogProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setReason("");
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (!collector) return;
    setSubmitting(true);
    try {
      await updateCollectorStatus(collector.id, "removed", reason.trim() || undefined);
      toast.success("Collector removed");
      setReason("");
      onSuccess();
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Couldn't remove collector";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!collector} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remove collector?</DialogTitle>
          <DialogDescription>
            {collector?.name ?? collector?.email} will lose access to the
            collector portal immediately. Their order history and earnings
            are kept — you can bring them back later by adding them again
            with the same email.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-1.5 py-2">
          <Label htmlFor="remove-reason">
            Reason{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </Label>
          <Input
            id="remove-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. left the area, policy violation"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? "Removing…" : "Remove Collector"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
