"use no memo";

import { useCallback, useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import type { MeResponse } from "@/api/auth";
import { Logo } from "@/components/ui/logo";
import { Text } from "@/components/ui/text";
import { api, ApiError } from "@/lib/api";
import { delay } from "@/lib/delay";
import { authService } from "@/services/authService";

async function verifyBackendSession(): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const me = await api.get<MeResponse>("/auth/me");
      if (!me.user?.id) {
        throw new Error("Not authenticated");
      }
      return;
    } catch (e) {
      lastError = e;
      if (e instanceof ApiError && e.status === 401) {
        throw e;
      }
      if (attempt === 0) {
        await delay(400);
      }
    }
  }
  throw lastError;
}

export default function SplashRoute() {
  const router = useRouter();
  const [bootError, setBootError] = useState<string | null>(null);

  const runBootstrap = useCallback(
    async (isRetry: boolean) => {
      setBootError(null);
      if (!isRetry) {
        await delay(700);
      }
      const [onboarded, session] = await Promise.all([
        authService.getOnboardingComplete(),
        authService.getSession(),
      ]);
      if (!onboarded) {
        router.replace("/(auth)/onboarding");
        return;
      }
      if (!session) {
        router.replace("/(auth)/login");
        return;
      }
      try {
        await verifyBackendSession();
        router.replace("/home");
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          await authService.signOut();
          router.replace("/(auth)/login");
          return;
        }
        const msg =
          e instanceof Error ? e.message : "Could not reach the server. Check your connection.";
        setBootError(msg);
      }
    },
    [router],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await runBootstrap(false);
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [runBootstrap]);

  return (
    <View className="flex-1 items-center justify-center bg-black px-6">
      <Logo size={180} />
      <Text variant="muted" className="mt-3 text-center text-neutral-300">
        Smart scrap pickup
      </Text>
      {bootError ? (
        <View className="mt-8 w-full max-w-sm items-center">
          <Text className="text-center text-[14px] text-red-300">{bootError}</Text>
          <Pressable
            onPress={() => void runBootstrap(true)}
            className="mt-4 rounded-xl bg-primary px-6 py-3 active:opacity-90 dark:bg-emerald-400"
          >
            <Text className="text-[14px] font-semibold text-primary-foreground dark:text-emerald-950">
              Retry
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
