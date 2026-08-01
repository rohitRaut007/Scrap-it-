"use client";

import { useTranslations } from "next-intl";

interface OpenAppButtonProps {
  slug: string;
}

/**
 * A secondary, low-commitment link for a visitor who already has the app
 * installed — the booking form above is the primary path for everyone else
 * (the app isn't published yet, so there's nothing to push people toward
 * installing). Attempts the custom-scheme deep link on click; if nothing's
 * installed to catch it, the click is simply a no-op and the visitor stays
 * on this page with the form still right there.
 */
export function OpenAppButton({ slug }: OpenAppButtonProps) {
  const t = useTranslations("book");

  return (
    <button
      type="button"
      onClick={() => {
        window.location.href = `scrapit://book/${slug}`;
      }}
      className="underline-offset-4 hover:underline"
    >
      {t("openAppSecondary")}
    </button>
  );
}
