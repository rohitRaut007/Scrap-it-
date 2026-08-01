"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import confetti from "canvas-confetti";
import { Check, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitGuestBooking, ApiError } from "@/lib/api";
import { reverseGeocode } from "@/lib/geocode";
import { cn } from "@/lib/utils";
import type { GuestBookingResult, RateCardItem } from "@/lib/types";

interface GuestBookingFormProps {
  bookingSlug: string;
  collectorName: string | null;
  serviceArea: string | null;
  rateCard: RateCardItem[];
}

const TIME_WINDOWS = [
  { id: "morning", startHour: 9 },
  { id: "afternoon", startHour: 12 },
  { id: "evening", startHour: 16 },
] as const;

type TimeWindowId = (typeof TIME_WINDOWS)[number]["id"];

function isWindowPast(dateOffset: number, startHour: number): boolean {
  if (dateOffset > 0) return false;
  return new Date().getHours() >= startHour;
}

function firstAvailable(): { dateOffset: number; timeWindow: TimeWindowId } {
  for (let offset = 0; offset < 4; offset++) {
    const window = TIME_WINDOWS.find((w) => !isWindowPast(offset, w.startHour));
    if (window) return { dateOffset: offset, timeWindow: window.id };
  }
  return { dateOffset: 3, timeWindow: "evening" };
}

function buildScheduledIso(dateOffset: number, startHour: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dateOffset);
  d.setHours(startHour, 0, 0, 0);
  return d.toISOString();
}

/**
 * Keeps the phone field to a bare 10-digit Indian mobile number as the user
 * types or pastes — strips everything but digits, drops a pasted "+91"/"0"
 * prefix, and caps the length. Mirrors the backend's `normalizeIndianPhone`
 * so what's on screen always matches what the API will accept, instead of
 * letting the user type something that only fails once submitted.
 */
function sanitizePhoneInput(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.length > 10 && digits.startsWith("91")) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 10);
}

const PHONE_PATTERN = /^\d{10}$/;

export function GuestBookingForm({
  bookingSlug,
  collectorName,
  serviceArea,
  rateCard,
}: GuestBookingFormProps) {
  const t = useTranslations("book");
  const locale = useLocale();

  const initial = useMemo(firstAvailable, []);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [dateOffset, setDateOffset] = useState(initial.dateOffset);
  const [timeWindow, setTimeWindow] = useState<TimeWindowId>(initial.timeWindow);
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState(serviceArea ?? "");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [notes, setNotes] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GuestBookingResult | null>(null);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const celebrated = useRef(false);

  useEffect(() => {
    if (!result || celebrated.current) return;
    celebrated.current = true;
    confetti({
      particleCount: 70,
      spread: 75,
      startVelocity: 32,
      origin: { y: 0.55 },
      colors: ["#B84E1C", "#1D5E3E", "#EDBB33"],
    });
  }, [result]);

  // If the page stays open across midnight or into a window that just
  // passed, keep the selection valid instead of letting it silently point
  // at a slot the backend will reject as "in the past".
  useEffect(() => {
    if (!isWindowPast(dateOffset, TIME_WINDOWS.find((w) => w.id === timeWindow)!.startHour)) {
      return;
    }
    const next = firstAvailable();
    setDateOffset(next.dateOffset);
    setTimeWindow(next.timeWindow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleCategory = (id: string) => {
    setCategoryIds((ids) =>
      ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id],
    );
  };

  const dateOptions = useMemo(() => {
    const now = new Date();
    return [0, 1, 2, 3].map((offset) => {
      const d = new Date(now);
      d.setDate(d.getDate() + offset);
      const label =
        offset === 0
          ? t("dateToday")
          : offset === 1
            ? t("dateTomorrow")
            : d.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });
      return { offset, label };
    });
  }, [locale, t]);

  const handleUseLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationError(t("locationUnsupported"));
      return;
    }
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setLocationError(t("locationInsecureContext"));
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        const address = await reverseGeocode(latitude, longitude);
        if (address) {
          if (address.addressLine) setAddressLine((prev) => prev || address.addressLine);
          if (address.city) setCity((prev) => prev || address.city);
        }
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? t("locationPermissionDenied")
            : err.code === err.TIMEOUT
              ? t("locationTimeout")
              : t("locationUnavailable"),
        );
      },
      { timeout: 8000, enableHighAccuracy: true },
    );
  };

  const phoneValid = PHONE_PATTERN.test(phone);

  const canSubmit =
    categoryIds.length > 0 &&
    addressLine.trim().length > 0 &&
    city.trim().length > 0 &&
    name.trim().length > 0 &&
    phoneValid &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const startHour = TIME_WINDOWS.find((w) => w.id === timeWindow)!.startHour;
      const booked = await submitGuestBooking(bookingSlug, {
        name: name.trim(),
        phone: phone.trim(),
        addressLine: addressLine.trim(),
        city: city.trim(),
        latitude: coords?.lat,
        longitude: coords?.lng,
        categoryIds,
        scheduledAt: buildScheduledIso(dateOffset, startHour),
        notes: notes.trim() || undefined,
      });
      setResult(booked);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("bookingGenericError"));
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    const when = new Date(result.scheduledAt).toLocaleString(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });
    return (
      <div className="space-y-3">
        <div className="animate-in zoom-in-95 fade-in relative overflow-hidden rounded-2xl border border-cash/25 bg-cash/10 shadow-elevation-1 duration-300">
          <div className="pointer-events-none absolute inset-0 bg-paper-grain opacity-[0.04] mix-blend-overlay" />

          {/* Decorative floating shapes — purely ambient, no semantic meaning. */}
          <span
            aria-hidden
            className="animate-ticket-float absolute top-4 left-5 text-lg text-signal/70 [animation-delay:0ms]"
          >
            +
          </span>
          <span
            aria-hidden
            className="animate-ticket-float absolute top-8 right-8 text-sm text-rust/60 [animation-delay:400ms]"
          >
            ○
          </span>
          <span
            aria-hidden
            className="animate-ticket-float absolute bottom-10 left-9 text-base text-cash/60 [animation-delay:800ms]"
          >
            ✦
          </span>
          <span
            aria-hidden
            className="animate-ticket-float absolute right-6 bottom-6 text-lg text-signal/70 [animation-delay:1200ms]"
          >
            +
          </span>

          <div className="relative p-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cash/15">
              <Check className="h-8 w-8 text-cash" strokeWidth={2.5} />
            </div>
            <p className="mt-4 font-display text-3xl tracking-tight text-cash">
              {t("bookedHeadline")}
            </p>
            <p className="mt-1.5 text-sm font-medium text-cash/90">
              {result.assignedDirect
                ? t("successDirect", {
                    name: result.collectorName ?? collectorName ?? t("metaTitleFallback"),
                  })
                : t("successPool")}
            </p>

            <div className="relative -mx-6 mt-5 border-t border-dashed border-cash/30 pt-4">
              <span className="absolute -top-2.5 -left-2.5 h-5 w-5 rounded-full bg-background" />
              <span className="absolute -top-2.5 -right-2.5 h-5 w-5 rounded-full bg-background" />
              <p className="font-mono text-xs text-muted-foreground">{when}</p>
            </div>
          </div>
        </div>
        {!nudgeDismissed && (
          <div className="flex items-center justify-between gap-2 rounded-xl border bg-muted/40 px-3.5 py-2.5">
            <p className="text-xs text-muted-foreground">{t("appComingSoon")}</p>
            <button
              type="button"
              onClick={() => setNudgeDismissed(true)}
              className="shrink-0 text-xs font-medium text-muted-foreground underline-offset-4 hover:underline"
            >
              {t("dismiss")}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-4 shadow-xs">
      <h2 className="text-sm font-semibold">{t("formTitle")}</h2>

      {/* Materials */}
      <div className="space-y-2">
        <Label>{t("materialsLabel")}</Label>
        <div className="flex flex-wrap gap-2">
          {rateCard.map((c) => {
            const selected = categoryIds.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCategory(c.id)}
                className={cn(
                  "rounded-full border px-3 py-2 text-sm font-medium transition-colors",
                  selected
                    ? "border-rust bg-rust text-paper"
                    : "border-border bg-transparent text-foreground hover:border-rust/50",
                )}
              >
                {c.name}
                <span className={cn("ml-1.5", selected ? "opacity-90" : "text-muted-foreground")}>
                  {c.rateInrPerKg != null ? `· ₹${c.rateInrPerKg}${t("perKg")}` : `· ${t("notSetYet")}`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* When */}
      <div className="space-y-2">
        <Label>{t("whenLabel")}</Label>
        <div className="flex flex-wrap gap-2">
          {dateOptions.map((d) => (
            <button
              key={d.offset}
              type="button"
              onClick={() => setDateOffset(d.offset)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                dateOffset === d.offset
                  ? "border-rust bg-rust text-paper"
                  : "border-border bg-transparent text-foreground hover:border-rust/50",
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {TIME_WINDOWS.map((w) => {
            const disabled = isWindowPast(dateOffset, w.startHour);
            const selected = timeWindow === w.id;
            return (
              <button
                key={w.id}
                type="button"
                disabled={disabled}
                onClick={() => setTimeWindow(w.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  disabled
                    ? "cursor-not-allowed border-border/50 text-muted-foreground/50"
                    : selected
                      ? "border-rust bg-rust text-paper"
                      : "border-border bg-transparent text-foreground hover:border-rust/50",
                )}
              >
                {t(`window_${w.id}`)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Where */}
      <div className="space-y-2">
        <Label htmlFor="guest-address">{t("addressLabel")}</Label>
        <Textarea
          id="guest-address"
          value={addressLine}
          onChange={(e) => setAddressLine(e.target.value)}
          placeholder={t("addressPlaceholder")}
          rows={2}
        />
        <div className="flex gap-2">
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={t("cityPlaceholder")}
            className="h-10"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 shrink-0 gap-1.5"
            onClick={handleUseLocation}
            disabled={locating}
          >
            {coords ? <Check className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
            {locating ? t("locating") : coords ? t("located") : t("useLocation")}
          </Button>
        </div>
        {locationError ? (
          <p className="text-xs text-destructive">{locationError}</p>
        ) : null}
      </div>

      {/* Who */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="guest-name">{t("nameLabel")}</Label>
          <Input
            id="guest-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("namePlaceholder")}
            className="h-10"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="guest-phone">{t("phoneLabel")}</Label>
          <Input
            id="guest-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            value={phone}
            onChange={(e) => setPhone(sanitizePhoneInput(e.target.value))}
            onBlur={() => setPhoneTouched(true)}
            placeholder={t("phonePlaceholder")}
            aria-invalid={phoneTouched && phone.length > 0 && !phoneValid}
            className="h-10"
          />
          {phoneTouched && phone.length > 0 && !phoneValid && (
            <p className="text-xs font-medium text-destructive">
              {t("phoneInvalid")}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="guest-notes">{t("notesLabel")}</Label>
        <Textarea
          id="guest-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t("notesPlaceholder")}
          rows={2}
        />
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
          {error}
        </p>
      )}

      <Button
        size="lg"
        className="w-full"
        disabled={!canSubmit}
        onClick={() => void handleSubmit()}
      >
        {submitting ? t("bookingSubmitting") : t("bookingSubmit")}
      </Button>
      {categoryIds.length === 0 && (
        <p className="text-center text-xs text-muted-foreground">
          {t("selectMaterialHint")}
        </p>
      )}
    </div>
  );
}
