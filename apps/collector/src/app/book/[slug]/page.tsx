import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Star } from "lucide-react";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { OpenAppButton } from "@/components/book/open-app-button";
import { GuestBookingForm } from "@/components/book/guest-booking-form";
import { RateTicker, ratesToTickerEntries } from "@/components/book/rate-ticker";
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
      <>
        <RateTicker entries={t("tickerFallback").split(" · ")} />
        <Shell>
          <div className="rounded-2xl border bg-card p-6 text-center shadow-xs">
            <h1 className="text-lg font-bold">{t("notFoundTitle")}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {t("notFoundSubtitle")}
            </p>
          </div>
        </Shell>
      </>
    );
  }

  return (
    <>
      <RateTicker
        entries={ratesToTickerEntries(collector.rateCard, t("tickerFallback"))}
      />
      <Shell>
        <div className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-elevation-1">
          <div className="pointer-events-none absolute inset-0 bg-paper-grain opacity-[0.05] mix-blend-overlay" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
              {initials(collector.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-3xl leading-tight tracking-tight md:text-4xl">
                {collector.name ?? t("metaTitleFallback")}
              </p>
              {collector.serviceArea && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {t("serviceAreaLabel")}: {collector.serviceArea}
                </p>
              )}
              <div className="mt-1.5 flex items-center gap-1 font-mono text-xs font-semibold">
                <Star className="h-3.5 w-3.5 fill-signal text-signal" />
                {collector.rating != null ? collector.rating.toFixed(1) : t("ratingNew")}
              </div>
            </div>
          </div>
          <span className="relative mt-3 inline-block rounded-full bg-primary/10 px-2.5 py-1 font-mono text-[10px] font-semibold tracking-widest text-primary uppercase">
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
    </>
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
