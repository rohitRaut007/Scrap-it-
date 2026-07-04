"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Check, Copy, QrCode, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface BookingQrCardProps {
  bookingUrl: string;
  collectorName: string | null;
}

export function BookingQrCard({ bookingUrl, collectorName }: BookingQrCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(bookingUrl, {
      width: 480,
      margin: 2,
      color: { dark: "#1a1a1a", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [bookingUrl]);

  const shareText = `Book your scrap pickup with ${collectorName ?? "me"} on Scrap-it — fair rates, weighed in front of you. ${bookingUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      toast.success("Booking link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy the link");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Book my scrap pickup", text: shareText });
        return;
      } catch {
        // user cancelled — fall through to WhatsApp
      }
    }
    window.open(
      `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-xs">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <QrCode className="h-4 w-4 text-primary" />
        Your personal booking link
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Customers who scan this book directly with you — the pickup is yours,
        guaranteed. Share it after every pickup.
      </p>

      <div className="mt-4 flex flex-col items-center">
        {qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrDataUrl}
            alt={`QR code for ${bookingUrl}`}
            className="h-44 w-44 rounded-xl border"
          />
        ) : (
          <Skeleton className="h-44 w-44 rounded-xl" />
        )}
        <p className="mt-3 break-all text-center font-mono text-xs text-muted-foreground">
          {bookingUrl.replace(/^https?:\/\//, "")}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Button variant="outline" className="gap-2" onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy link"}
        </Button>
        <Button className="gap-2" onClick={handleShare}>
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </div>
    </div>
  );
}
