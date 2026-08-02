"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { collectorApi, ApiError } from "@/lib/api";
import type { CollectorProfile } from "@/lib/types";

const DEFAULT_ACCENT = "#B84E1C";
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

interface InvoiceDetailsFormProps {
  profile: CollectorProfile;
  onSaved: () => Promise<unknown>;
}

export function InvoiceDetailsForm({ profile, onSaved }: InvoiceDetailsFormProps) {
  const t = useTranslations("invoice");
  const tCommon = useTranslations("common");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    businessTagline: "",
    payableTo: "",
    accentColor: "",
    defaultTermsAndConditions: "",
  });

  useEffect(() => {
    // Skip re-seeding while open for editing — a background revalidation
    // shouldn't silently clobber in-progress unsaved edits.
    if (!editing) {
      setForm({
        businessTagline: profile.businessTagline ?? "",
        payableTo: profile.payableTo ?? "",
        accentColor: profile.accentColor ?? "",
        defaultTermsAndConditions: profile.defaultTermsAndConditions ?? "",
      });
    }
  }, [profile, editing]);

  const accentInvalid =
    form.accentColor.trim() !== "" && !HEX_COLOR_RE.test(form.accentColor.trim());

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (accentInvalid) return;
    setSaving(true);
    try {
      await collectorApi.updateProfile({
        ...form,
        accentColor: form.accentColor.trim(),
      });
      // The save itself succeeded — reflect that regardless of whether the
      // follow-up revalidation below succeeds.
      setEditing(false);
      toast.success(t("toastSettingsUpdated"));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("toastError"));
      return;
    } finally {
      setSaving(false);
    }
    try {
      await onSaved();
    } catch {
      // Non-fatal — the profile data will catch up on next fetch/focus.
    }
  };

  return (
    <div className="rounded-2xl border border-ink/15 bg-card p-4 shadow-elevation-1">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-xs font-semibold tracking-[0.2em] text-rust uppercase">
          {t("letterheadSettingsTitle")}
        </h2>
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
      <p className="mt-1 text-xs text-muted-foreground">
        {t("letterheadSettingsHint")}
      </p>

      {editing ? (
        <form onSubmit={handleSave} className="mt-3 space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="businessTagline">{t("taglineLabel")}</Label>
            <Input
              id="businessTagline"
              value={form.businessTagline}
              onChange={(e) =>
                setForm((f) => ({ ...f, businessTagline: e.target.value }))
              }
              placeholder={t("taglinePlaceholder")}
              disabled={saving}
              maxLength={160}
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="payableTo">{t("payableToLabel")}</Label>
            <Input
              id="payableTo"
              value={form.payableTo}
              onChange={(e) => setForm((f) => ({ ...f, payableTo: e.target.value }))}
              placeholder={t("payableToPlaceholder")}
              disabled={saving}
              maxLength={120}
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="accentColor">{t("accentColorLabel")}</Label>
            <div className="flex items-center gap-2">
              <div
                className="h-9 w-9 shrink-0 rounded-lg border"
                style={{
                  backgroundColor: HEX_COLOR_RE.test(form.accentColor.trim())
                    ? form.accentColor.trim()
                    : DEFAULT_ACCENT,
                }}
              />
              <Input
                id="accentColor"
                value={form.accentColor}
                onChange={(e) =>
                  setForm((f) => ({ ...f, accentColor: e.target.value }))
                }
                placeholder={DEFAULT_ACCENT}
                disabled={saving}
                className="h-10 flex-1"
                aria-invalid={accentInvalid}
              />
            </div>
            {accentInvalid && (
              <p className="text-xs text-destructive">{t("accentColorInvalid")}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="defaultTermsAndConditions">{t("termsAndConditionsLabel")}</Label>
            <Textarea
              id="defaultTermsAndConditions"
              value={form.defaultTermsAndConditions}
              onChange={(e) =>
                setForm((f) => ({ ...f, defaultTermsAndConditions: e.target.value }))
              }
              placeholder={t("termsAndConditionsPlaceholder")}
              disabled={saving}
              maxLength={1000}
              rows={4}
            />
          </div>
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
            <Button type="submit" className="flex-1" disabled={saving || accentInvalid}>
              {saving ? t("saving") : t("saveChanges")}
            </Button>
          </div>
        </form>
      ) : (
        <dl className="mt-3 space-y-2.5 text-sm">
          <DetailRow
            label={t("taglineLabel")}
            value={profile.businessTagline}
            notSetLabel={t("notSet")}
          />
          <DetailRow
            label={t("payableToLabel")}
            value={profile.payableTo}
            notSetLabel={t("notSet")}
          />
          <div className="flex items-baseline justify-between gap-4">
            <dt className="shrink-0 text-muted-foreground">{t("accentColorLabel")}</dt>
            <dd className="flex items-center gap-2">
              <div
                className="h-4 w-4 rounded-full border"
                style={{ backgroundColor: profile.accentColor ?? DEFAULT_ACCENT }}
              />
              <span className="font-medium">{profile.accentColor ?? DEFAULT_ACCENT}</span>
            </dd>
          </div>
          <DetailRow
            label={t("termsAndConditionsLabel")}
            value={profile.defaultTermsAndConditions}
            notSetLabel={t("notSet")}
          />
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
          value ? "text-right font-medium" : "text-right text-muted-foreground/60"
        }
      >
        {value ?? notSetLabel}
      </dd>
    </div>
  );
}
