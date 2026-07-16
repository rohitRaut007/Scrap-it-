"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RateCardForm } from "@/components/profile/rate-card-form";

export default function RateCardPage() {
  const t = useTranslations("rateCard");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="-ml-2 gap-1.5" asChild>
          <Link href="/profile">
            <ArrowLeft className="h-4 w-4" />
            {t("title")}
          </Link>
        </Button>
      </div>
      <RateCardForm />
    </div>
  );
}
