import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AppHeader } from "@/components/layout/app-header";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";
import { addressService } from "@/services/addressService";
import { formatAddressSummary } from "@/lib/formatAddress";
import type { AddressSummary } from "@/types/domain";
import { useAppTheme } from "@/lib/theme";

function describeError(err: unknown): string {
  if (err instanceof ApiError) return `${err.message} (HTTP ${err.status})`;
  if (err instanceof Error) return err.message;
  return "Something went wrong.";
}

export function SavedAddressesScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [addresses, setAddresses] = useState<AddressSummary[]>([]);
  const [loadState, setLoadState] = useState<"pending" | "ok" | "error">(
    "pending",
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadState("pending");
    setError(null);
    try {
      const data = await addressService.list();
      setAddresses(data);
      setLoadState("ok");
    } catch (e) {
      setError(describeError(e));
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setDefault = useCallback(
    async (id: string) => {
      if (busyId) return;
      setBusyId(id);
      try {
        await addressService.setDefault(id);
        await load();
      } catch (e) {
        Alert.alert("Couldn't update default", describeError(e));
      } finally {
        setBusyId(null);
      }
    },
    [busyId, load],
  );

  const remove = useCallback(
    (id: string) => {
      if (busyId) return;
      Alert.alert("Delete address", "This cannot be undone.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setBusyId(id);
            try {
              await addressService.remove(id);
              await load();
            } catch (e) {
              Alert.alert("Couldn't delete", describeError(e));
            } finally {
              setBusyId(null);
            }
          },
        },
      ]);
    },
    [busyId, load],
  );

  return (
    <Screen>
      <AppHeader title="Saved addresses" onBack={() => router.back()} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      >
        <Text variant="muted" className="mb-4 text-[14px]">
          These are the addresses we&apos;ll offer when you schedule a pickup.
        </Text>

        {loadState === "pending" ? (
          <View className="gap-3">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </View>
        ) : loadState === "error" ? (
          <Card className="border-destructive/25 dark:border-red-400/30">
            <Text className="text-[14px] text-foreground">
              Couldn&apos;t load addresses. Check your connection and try again.
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
        ) : addresses.length === 0 ? (
          <Card>
            <Text className="text-[14px] text-foreground">
              You haven&apos;t saved any addresses yet.
            </Text>
            <Text variant="muted" className="mt-1 text-[13px]">
              Add one to schedule pickups faster next time.
            </Text>
          </Card>
        ) : (
          <View className="gap-3">
            {addresses.map((a) => (
              <Card key={a.id} className="gap-3">
                <View className="flex-row items-start gap-3">
                  <View className="mt-0.5">
                    <Ionicons
                      name="location-outline"
                      size={20}
                      color={colors.icon}
                    />
                  </View>
                  <View className="min-w-0 flex-1">
                    <View className="flex-row flex-wrap items-center gap-2">
                      <Text className="font-semibold text-foreground">
                        {a.label?.trim() || "Address"}
                      </Text>
                      {a.isDefault ? (
                        <Text className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary dark:bg-emerald-400/15 dark:text-emerald-300">
                          Default
                        </Text>
                      ) : null}
                    </View>
                    <Text variant="muted" className="mt-1 text-[13px]">
                      {formatAddressSummary(a)}
                    </Text>
                  </View>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onPress={() => router.push(`/saved-addresses/${a.id}/edit`)}
                    disabled={busyId === a.id}
                  >
                    Edit
                  </Button>
                  {!a.isDefault ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onPress={() => void setDefault(a.id)}
                      disabled={busyId === a.id}
                      loading={busyId === a.id}
                    >
                      Make default
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="ghost"
                    onPress={() => remove(a.id)}
                    disabled={busyId === a.id}
                  >
                    Delete
                  </Button>
                </View>
              </Card>
            ))}
          </View>
        )}

        <Button
          className="mt-6"
          onPress={() => router.push("/saved-addresses/new")}
          disabled={loadState === "pending"}
        >
          Add new address
        </Button>
      </ScrollView>
    </Screen>
  );
}
