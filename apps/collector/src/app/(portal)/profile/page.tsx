"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Pencil, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { BookingQrCard } from "@/components/profile/booking-qr-card";
import { useProfile } from "@/hooks/use-portal";
import { collectorApi, ApiError } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { formatDate, formatInr, initials } from "@/lib/format";

export default function ProfilePage() {
  const router = useRouter();
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
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save changes.");
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
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <ErrorState onRetry={() => mutate()} />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Profile</h1>

      {/* Identity card */}
      <div className="rounded-2xl border bg-card p-5 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
            {initials(profile.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-lg font-bold">
              {profile.name ?? "Add your name"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {profile.serviceArea ?? profile.email}
            </p>
            <div className="mt-1 flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 font-semibold">
                <Star className="h-3.5 w-3.5 fill-signal text-signal" />
                {profile.rating != null ? profile.rating.toFixed(1) : "New"}
              </span>
              <span className="text-muted-foreground">
                {profile.totalCompleted} pickups · {formatInr(profile.totalEarningsInr)} earned
              </span>
            </div>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Collecting with Scrap-it since {formatDate(profile.memberSince)}
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
          <h2 className="text-sm font-semibold">Your details</h2>
          {!editing && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-primary"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="mt-3 space-y-3.5">
            <Field
              id="name"
              label="Full name"
              value={form.name}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
              placeholder="e.g. Sunil Kamble"
              disabled={saving}
            />
            <Field
              id="phone"
              label="Phone"
              value={form.phone}
              onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
              placeholder="+91 98xxx xxxxx"
              disabled={saving}
              inputMode="tel"
            />
            <Field
              id="vehicleInfo"
              label="Vehicle"
              value={form.vehicleInfo}
              onChange={(v) => setForm((f) => ({ ...f, vehicleInfo: v }))}
              placeholder="e.g. Tata Ace · MH-12 AB 1234"
              disabled={saving}
            />
            <Field
              id="serviceArea"
              label="Service area"
              value={form.serviceArea}
              onChange={(v) => setForm((f) => ({ ...f, serviceArea: v }))}
              placeholder="e.g. Kothrud, Pune"
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
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        ) : (
          <dl className="mt-3 space-y-2.5 text-sm">
            <DetailRow label="Phone" value={profile.phone} />
            <DetailRow label="Vehicle" value={profile.vehicleInfo} />
            <DetailRow label="Service area" value={profile.serviceArea} />
            <DetailRow label="Email" value={profile.email} />
          </dl>
        )}
      </div>

      {/* Sign out (mobile — desktop has it in the sidebar) */}
      <Button
        variant="outline"
        className="w-full gap-2 text-muted-foreground md:hidden"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4" />
        Sign out
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

function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className={value ? "text-right font-medium" : "text-right text-muted-foreground/60"}>
        {value ?? "Not set"}
      </dd>
    </div>
  );
}
