"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronRight, LogOut, Pencil, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { BookingQrCard } from "@/components/profile/booking-qr-card";
import { BusinessDetailsForm } from "@/components/profile/business-details-form";
import { useProfile } from "@/hooks/use-portal";
import { collectorApi, ApiError } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { formatDate, formatInr, initials } from "@/lib/format";

export default function ProfilePage() {
  const router = useRouter();
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const { data: profile, isLoading, error, mutate } = useProfile();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    vehicleInfo: "",
    serviceArea: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name ?? "",
        phone: profile.phone ?? "",
        vehicleInfo: profile.vehicleInfo ?? "",
        serviceArea: profile.serviceArea ?? "",
      });
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await collectorApi.updateProfile(form);
      await mutate();
      setEditing(false);
      toast.success(t("toastUpdated"));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("toastError"));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (isLoading && !profile) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <ErrorState onRetry={() => mutate()} />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>

      {/* Identity card */}
      <div className="rounded-2xl border bg-card p-5 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
            {initials(profile.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-lg font-bold">
              {profile.name ?? t("addName")}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {profile.serviceArea ?? profile.email}
            </p>
            <div className="mt-1 flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 font-semibold">
                <Star className="h-3.5 w-3.5 fill-signal text-signal" />
                {profile.rating != null ? profile.rating.toFixed(1) : t("ratingNew")}
              </span>
              <span className="text-muted-foreground">
                {t("statsLine", {
                  count: profile.totalCompleted,
                  amount: formatInr(profile.totalEarningsInr),
                })}
              </span>
            </div>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          {t("memberSince", { date: formatDate(profile.memberSince) })}
        </p>
      </div>

      {/* Booking QR */}
      {profile.bookingUrl && (
        <BookingQrCard
          bookingUrl={profile.bookingUrl}
          collectorName={profile.name}
        />
      )}

      {/* Details / edit form */}
      <div className="rounded-2xl border bg-card p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">{t("yourDetails")}</h2>
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

        {editing ? (
          <form onSubmit={handleSave} className="mt-3 space-y-3.5">
            <Field
              id="name"
              label={t("nameLabel")}
              value={form.name}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
              placeholder={t("namePlaceholder")}
              disabled={saving}
            />
            <Field
              id="phone"
              label={t("phoneLabel")}
              value={form.phone}
              onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
              placeholder={t("phonePlaceholder")}
              disabled={saving}
              inputMode="tel"
            />
            <Field
              id="vehicleInfo"
              label={t("vehicleLabel")}
              value={form.vehicleInfo}
              onChange={(v) => setForm((f) => ({ ...f, vehicleInfo: v }))}
              placeholder={t("vehiclePlaceholder")}
              disabled={saving}
            />
            <Field
              id="serviceArea"
              label={t("serviceAreaLabel")}
              value={form.serviceArea}
              onChange={(v) => setForm((f) => ({ ...f, serviceArea: v }))}
              placeholder={t("serviceAreaPlaceholder")}
              disabled={saving}
            />
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
            <DetailRow label={t("phoneLabel")} value={profile.phone} notSetLabel={t("notSet")} />
            <DetailRow label={t("vehicleLabel")} value={profile.vehicleInfo} notSetLabel={t("notSet")} />
            <DetailRow label={t("serviceAreaLabel")} value={profile.serviceArea} notSetLabel={t("notSet")} />
            <DetailRow label={t("emailLabel")} value={profile.email} notSetLabel={t("notSet")} />
          </dl>
        )}
      </div>

      {/* Rate card */}
      <Button variant="outline" className="w-full justify-between" asChild>
        <Link href="/profile/rate-card">
          {t("rateCardLink")}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>

      {/* Business details for receipts (all optional, privacy-gated) */}
      <BusinessDetailsForm profile={profile} onSaved={() => mutate()} />

      {/* Sign out (mobile — desktop has it in the sidebar) */}
      <Button
        variant="outline"
        className="w-full gap-2 text-muted-foreground md:hidden"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4" />
        {tCommon("logout")}
      </Button>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled,
  inputMode,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  inputMode?: "tel";
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        inputMode={inputMode}
        className="h-10"
      />
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
      <dd className={value ? "text-right font-medium" : "text-right text-muted-foreground/60"}>
        {value ?? notSetLabel}
      </dd>
    </div>
  );
}
