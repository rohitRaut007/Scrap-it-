import type { Metadata, Viewport } from "next";
import { Rozha_One, Fira_Sans, IBM_Plex_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "./providers";
import "./globals.css";

const rozha = Rozha_One({
  variable: "--font-rozha",
  subsets: ["latin", "devanagari"],
  weight: "400",
  display: "swap",
});

// Primary/body font. Note: Fira Sans has no Devanagari subset — hi/mr text
// gracefully falls back to the browser's default Devanagari font for those
// glyphs (Hind, the previous choice, covered Devanagari natively).
const firaSans = Fira_Sans({
  variable: "--font-primary",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plexmono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Scrap-it Collector",
  description: "Manage your pickups, earnings and customers",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1A1918",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={`${rozha.variable} ${firaSans.variable} ${plexMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <Providers>
            {children}
            <Toaster position="top-center" richColors />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
