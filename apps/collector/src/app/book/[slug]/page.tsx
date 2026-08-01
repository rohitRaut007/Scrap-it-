import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Star } from "lucide-react";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { OpenAppButton } from "@/components/book/open-app-button";
import { GuestBookingForm } from "@/components/book/guest-booking-form";
import { getPublicCollectorBySlug } from "@/lib/api";
import { initials } from "@/lib/format";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [collector, t] = await Promise.all([
    getPublicCollectorBySlug(slug),
    getTranslations("book"),
  ]);

  if (!collector) {
    return { title: t("metaTitleFallback") };
  }
  const name = collector.name ?? t("metaTitleFallback");
  return {
    title: t("metaTitle", { name }),
    description: t("metaDescription", { name }),
    openGraph: {
      title: t("metaTitle", { name }),
      description: t("metaDescription", { name }),
    },
  };
}

export default async function BookPage({ params }: PageProps) {
  const { slug } = await params;
  const [collector, t] = await Promise.all([
    getPublicCollectorBySlug(slug),
    getTranslations("book"),
  ]);

  if (!collector) {
    return (
      <Shell>
        <div className="rounded-2xl border bg-card p-6 text-center shadow-xs">
          <h1 className="text-lg font-bold">{t("notFoundTitle")}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {t("notFoundSubtitle")}
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="rounded-2xl border bg-card p-5 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
            {initials(collector.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold">
              {collector.name ?? t("metaTitleFallback")}
            </p>
            {collector.serviceArea && (
              <p className="truncate text-xs text-muted-foreground">
                {t("serviceAreaLabel")}: {collector.serviceArea}
              </p>
            )}
            <div className="mt-1 flex items-center gap-1 text-xs font-semibold">
              <Star className="h-3.5 w-3.5 fill-signal text-signal" />
              {collector.rating != null ? collector.rating.toFixed(1) : t("ratingNew")}
            </div>
          </div>
        </div>
        <span className="mt-3 inline-block rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
          {t("verifiedBadge")}
        </span>
      </div>

      <GuestBookingForm
        bookingSlug={collector.bookingSlug}
        collectorName={collector.name}
        serviceArea={collector.serviceArea}
        rateCard={collector.rateCard}
      />

      <div className="text-center text-xs text-muted-foreground">
        <OpenAppButton slug={collector.bookingSlug} />
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 px-4 py-8">
      <div className="flex justify-end">
        <LanguageSwitcher />
      </div>
      {children}
    </div>
  );
}
