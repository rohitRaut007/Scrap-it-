"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { inviteCollector } from "@/hooks/use-collectors";
import { ApiError } from "@/lib/api";

interface AddCollectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const EMPTY_FORM = { name: "", phone: "", email: "", vehicleInfo: "" };

export function AddCollectorDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddCollectorDialogProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    tempPassword: string;
    isReactivation: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const resetAndClose = () => {
    setForm(EMPTY_FORM);
    setResult(null);
    setCopied(false);
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await inviteCollector({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        vehicleInfo: form.vehicleInfo.trim() || undefined,
      });
      setResult({
        tempPassword: res.tempPassword,
        isReactivation: res.isReactivation,
      });
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Failed to add collector";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.tempPassword);
    setCopied(true);
    toast.success("Copied to clipboard");
  };

  const handleDone = () => {
    resetAndClose();
    onSuccess();
  };

  const isFormValid =
    form.name.trim() && form.phone.trim() && /\S+@\S+\.\S+/.test(form.email);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Don't allow dismissing the one-time password reveal by accident.
        if (!next && result) return;
        if (!next) resetAndClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        {!result ? (
          <>
            <DialogHeader>
              <DialogTitle>Add Collector</DialogTitle>
              <DialogDescription>
                Creates a collector account with a temporary password you can
                share directly (WhatsApp/SMS) — no email is sent.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5">
                <Label htmlFor="collector-name">Name</Label>
                <Input
                  id="collector-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Full name"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="collector-phone">Phone</Label>
                <Input
                  id="collector-phone"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  placeholder="+91 …"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="collector-email">Email</Label>
                <Input
                  id="collector-email"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="collector@example.com"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="collector-vehicle">
                  Vehicle info{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="collector-vehicle"
                  value={form.vehicleInfo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, vehicleInfo: e.target.value }))
                  }
                  placeholder="e.g. Tempo, MH-12-AB-1234"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={resetAndClose}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !isFormValid}
              >
                {submitting ? "Adding…" : "Add Collector"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                {result.isReactivation
                  ? "Collector Reactivated"
                  : "Collector Added"}
              </DialogTitle>
              <DialogDescription>
                {result.isReactivation
                  ? "This collector was previously removed — their account has been reactivated with a new password."
                  : "Share this password with the collector now."}
              </DialogDescription>
            </DialogHeader>

            <div className="py-2 space-y-3">
              <Alert variant="destructive">
                <AlertTitle>Save or share this now</AlertTitle>
                <AlertDescription>
                  This password won&apos;t be shown again.
                </AlertDescription>
              </Alert>

              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={result.tempPassword}
                  className="font-mono"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  aria-label="Copy password"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleDone}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
