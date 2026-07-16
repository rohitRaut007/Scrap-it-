"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Recycle, Truck, IndianRupee, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { getRoleFromJwt } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations("login");
  const tNav = useTranslations("nav");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const highlights = [
    { icon: Truck, text: t("highlightAccept") },
    { icon: IndianRupee, text: t("highlightEarnings") },
    { icon: Star, text: t("highlightReputation") },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: authError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        setError(authError.message);
        return;
      }

      const token = data.session?.access_token;
      if (!token) {
        setError(t("errorGeneric"));
        return;
      }

      const role = getRoleFromJwt(token);
      if (role !== "collector") {
        await supabase.auth.signOut();
        setError(t("errorNotCollector"));
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(t("errorUnexpected"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {/* Brand hero */}
      <div className="bg-primary text-primary-foreground px-6 pt-14 pb-16 rounded-b-[2.5rem]">
        <div className="mx-auto w-full max-w-sm">
          <div className="flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
              <Recycle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-bold leading-tight">Scrap-it</p>
              <p className="text-xs text-primary-foreground/80 leading-tight">
                {tNav("portalName")}
              </p>
            </div>
          </div>
          <h1 className="mt-8 text-2xl font-bold leading-snug">
            {t("heroLine1")}
            <br />
            {t("heroLine2")}
          </h1>
          <ul className="mt-5 space-y-2.5">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2.5 text-sm text-primary-foreground/90">
                <Icon className="h-4 w-4 shrink-0" />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Sign-in card */}
      <div className="flex-1 px-6 -mt-8 pb-10">
        <div className="mx-auto w-full max-w-sm rounded-2xl border bg-card p-6 shadow-lg shadow-black/5">
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t("subtitle")}
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">{t("emailLabel")}</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder={t("emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">{t("passwordLabel")}</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="h-11"
              />
            </div>

            <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
              {loading ? t("signingIn") : t("submit")}
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            {t("footerNote")}
          </p>
        </div>
      </div>
    </div>
  );
}
