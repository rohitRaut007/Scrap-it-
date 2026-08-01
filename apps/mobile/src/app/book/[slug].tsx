import { useEffect, useRef } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Logo } from "@/components/ui/logo";
import { authService } from "@/services/authService";
import { referralService } from "@/services/referralService";

/**
 * Where a collector's QR/booking link lands (both the `scrapit://book/:slug`
 * custom scheme and, once Universal/App Links are verified, the
 * `https://scrapit.app/book/:slug` web URL resolve here via Expo Router's
 * file-based linking). Persists the slug and hands off to login or straight
 * into the pickup flow — the pickup flow itself reads it back and submits it
 * as `collectorSlug` so the order is assigned directly, not pooled.
 */
export default function BookRoute() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const handledSlug = useRef<string | null>(null);

  useEffect(() => {
    if (!slug || handledSlug.current === slug) return;
    handledSlug.current = slug;
    void (async () => {
      await referralService.setPendingSlug(slug);
      const signedIn = await authService.getSession();
      router.replace(signedIn ? "/pickup" : "/(auth)/login");
    })();
  }, [router, slug]);

  return (
    <View className="flex-1 items-center justify-center bg-black">
      <Logo size={140} />
    </View>
  );
}
