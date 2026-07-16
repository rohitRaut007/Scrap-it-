"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Pencil, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { collectorApi, ApiError } from "@/lib/api";
import type { CollectorProfile } from "@/lib/types";

interface BusinessDetailsFormProps {
  profile: CollectorProfile;
  onSaved: () => Promise<unknown>;
}

export function BusinessDetailsForm({
  profile,
  onSaved,
}: BusinessDetailsFormProps) {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    shopName: "",
    shopAddressText: "",
    gstNumber: "",
    showBusinessDetailsOnReceipt: false,
  });

  useEffect(() => {
    setForm({
      shopName: profile.shopName ?? "",
      shopAddressText: profile.shopAddressText ?? "",
      gstNumber: profile.gstNumber ?? "",
      showBusinessDetailsOnReceipt: profile.showBusinessDetailsOnReceipt,
    });
  }, [profile]);

  const draftHasAnyField = Boolean(
    form.shopName.trim() || form.shopAddressText.trim() || form.gstNumber.trim(),
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await collectorApi.updateProfile(form);
      await onSaved();
      setEditing(false);
      toast.success(t("toastUpdated"));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("toastError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-xs">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{t("businessDetailsTitle")}</h2>
        {!editing && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-primary"
            onClick={() => setEditing(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
            {t("edit")}
          </Button>
        )}
      </div>
      <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {t("businessDetailsPrivacyNote")}
      </p>

      {editing ? (
        <form onSubmit={handleSave} className="mt-3 space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="shopName">{t("shopNameLabel")}</Label>
            <Input
              id="shopName"
              value={form.shopName}
              onChange={(e) =>
                setForm((f) => ({ ...f, shopName: e.target.value }))
              }
              placeholder={t("shopNamePlaceholder")}
              disabled={saving}
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="shopAddressText">{t("shopAddressLabel")}</Label>
            <Input
              id="shopAddressText"
              value={form.shopAddressText}
              onChange={(e) =>
                setForm((f) => ({ ...f, shopAddressText: e.target.value }))
              }
              placeholder={t("shopAddressPlaceholder")}
              disabled={saving}
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gstNumber">{t("gstLabel")}</Label>
            <Input
              id="gstNumber"
              value={form.gstNumber}
              onChange={(e) =>
                setForm((f) => ({ ...f, gstNumber: e.target.value }))
              }
              placeholder={t("gstPlaceholder")}
              disabled={saving}
              className="h-10"
            />
          </div>
          {draftHasAnyField && (
            <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
              <div className="min-w-0">
                <Label htmlFor="showOnReceipt">{t("showOnReceiptLabel")}</Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("showOnReceiptHint")}
                </p>
              </div>
              <Switch
                id="showOnReceipt"
                checked={form.showBusinessDetailsOnReceipt}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, showBusinessDetailsOnReceipt: checked }))
                }
                disabled={saving}
              />
            </div>
          )}
          <div className="flex gap-2.5 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              {tCommon("cancel")}
            </Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? t("saving") : t("saveChanges")}
            </Button>
          </div>
        </form>
      ) : (
        <dl className="mt-3 space-y-2.5 text-sm">
          <DetailRow
            label={t("shopNameLabel")}
            value={profile.shopName}
            notSetLabel={t("notSet")}
          />
          <DetailRow
            label={t("shopAddressLabel")}
            value={profile.shopAddressText}
            notSetLabel={t("notSet")}
          />
          <DetailRow
            label={t("gstLabel")}
            value={profile.gstNumber}
            notSetLabel={t("notSet")}
          />
          {profile.hasBusinessDetails && (
            <div className="flex items-baseline justify-between gap-4">
              <dt className="shrink-0 text-muted-foreground">
                {t("showOnReceiptLabel")}
              </dt>
              <dd className="text-right font-medium">
                {profile.showBusinessDetailsOnReceipt
                  ? tCommon("on")
                  : tCommon("off")}
              </dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
  notSetLabel,
}: {
  label: string;
  value: string | null;
  notSetLabel: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd
        className={
          value
            ? "text-right font-medium"
            : "text-right text-muted-foreground/60"
        }
      >
        {value ?? notSetLabel}
      </dd>
    </div>
  );
}
