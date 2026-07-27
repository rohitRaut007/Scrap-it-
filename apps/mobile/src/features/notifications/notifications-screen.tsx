import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { AppHeader } from "@/components/layout/app-header";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";
import { notificationService } from "@/services/notificationService";
import type { AppNotification } from "@/types/domain";

function describeError(err: unknown): string {
  if (err instanceof ApiError) return `${err.message} (HTTP ${err.status})`;
  if (err instanceof Error) return err.message;
  return "Something went wrong.";
}

export function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loadState, setLoadState] = useState<"pending" | "ok" | "error">(
    "pending",
  );
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadState("pending");
    setError(null);
    try {
      const res = await notificationService.list();
      setNotifications(res.data);
      setLoadState("ok");
    } catch (e) {
      setError(describeError(e));
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id && !n.readAt
          ? { ...n, readAt: new Date().toISOString() }
          : n,
      ),
    );
    try {
      await notificationService.markRead(id);
    } catch {
      // Non-fatal — the list will reconcile on next load.
    }
  }, []);

  return (
    <Screen>
      <AppHeader title="Notifications" onBack={() => router.back()} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      >
        {loadState === "pending" ? (
          <View className="gap-3">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </View>
        ) : loadState === "error" ? (
          <Card className="border-destructive/25 dark:border-red-400/30">
            <Text className="text-[14px] text-foreground">
              Couldn&apos;t load notifications. Check your connection and try
              again.
            </Text>
            {error ? (
              <Text variant="muted" className="mt-1 text-[12px]">
                {error}
              </Text>
            ) : null}
            <Pressable onPress={() => void load()} className="mt-3 self-start">
              <Text className="text-[14px] font-semibold text-primary dark:text-emerald-300">
                Retry
              </Text>
            </Pressable>
          </Card>
        ) : notifications.length === 0 ? (
          <Card>
            <Text className="text-[14px] text-foreground">
              You&apos;re all caught up.
            </Text>
            <Text variant="muted" className="mt-1 text-[13px]">
              Updates about your pickups will show up here.
            </Text>
          </Card>
        ) : (
          <View className="gap-3">
            {notifications.map((n) => (
              <Pressable
                key={n.id}
                onPress={() => void markRead(n.id)}
                disabled={Boolean(n.readAt)}
              >
                <Card
                  className={
                    n.readAt ? "opacity-60" : "border-primary/30 dark:border-emerald-400/30"
                  }
                >
                  <View className="flex-row items-start justify-between gap-2">
                    <Text className="flex-1 font-semibold text-foreground">
                      {n.title ?? "Notification"}
                    </Text>
                    {!n.readAt ? (
                      <View className="mt-1 size-2 rounded-full bg-primary dark:bg-emerald-400" />
                    ) : null}
                  </View>
                  {n.body ? (
                    <Text variant="muted" className="mt-1 text-[13px]">
                      {n.body}
                    </Text>
                  ) : null}
                  <Text variant="muted" className="mt-2 text-[11px]">
                    {new Date(n.createdAt).toLocaleString()}
                  </Text>
                </Card>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
