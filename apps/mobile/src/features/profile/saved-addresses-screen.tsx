import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
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

export function SavedAddressesScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const [addresses, setAddresses] = useState<AddressSummary[]>([]);
  const [loadState, setLoadState] = useState<"pending" | "ok" | "error">(
    "pending",
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const describeError = useCallback(
    (err: unknown): string => {
      if (err instanceof ApiError) return `${err.message} (HTTP ${err.status})`;
      if (err instanceof Error) return err.message;
      return t("savedAddresses.genericError");
    },
    [t],
  );

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
  }, [describeError]);

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
        Alert.alert(t("savedAddresses.updateDefaultErrorTitle"), describeError(e));
      } finally {
        setBusyId(null);
      }
    },
    [busyId, load, describeError, t],
  );

  const remove = useCallback(
    (id: string) => {
      if (busyId) return;
      Alert.alert(
        t("savedAddresses.deleteConfirmTitle"),
        t("savedAddresses.deleteConfirmBody"),
        [
          { text: t("savedAddresses.deleteConfirmCancel"), style: "cancel" },
          {
            text: t("savedAddresses.deleteConfirmAction"),
            style: "destructive",
            onPress: async () => {
              setBusyId(id);
              try {
                await addressService.remove(id);
                await load();
              } catch (e) {
                Alert.alert(t("savedAddresses.deleteErrorTitle"), describeError(e));
              } finally {
                setBusyId(null);
              }
            },
          },
        ],
      );
    },
    [busyId, load, describeError, t],
  );

  return (
    <Screen>
      <AppHeader title={t("savedAddresses.title")} onBack={() => router.back()} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      >
        <Text variant="muted" className="mb-4 text-[14px]">
          {t("savedAddresses.intro")}
        </Text>

        {loadState === "pending" ? (
          <View className="gap-3">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </View>
        ) : loadState === "error" ? (
          <Card className="border-destructive/25 dark:border-red-400/30">
            <Text className="text-[14px] text-foreground">
              {t("savedAddresses.loadError")}
            </Text>
            {error ? (
              <Text variant="muted" className="mt-1 text-[12px]">
                {error}
              </Text>
            ) : null}
            <Pressable onPress={() => void load()} className="mt-3 self-start">
              <Text className="text-[14px] font-semibold text-primary dark:text-emerald-300">
                {t("savedAddresses.retry")}
              </Text>
            </Pressable>
          </Card>
        ) : addresses.length === 0 ? (
          <Card>
            <Text className="text-[14px] text-foreground">
              {t("savedAddresses.emptyTitle")}
            </Text>
            <Text variant="muted" className="mt-1 text-[13px]">
              {t("savedAddresses.emptyBody")}
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
                        {a.label?.trim() || t("savedAddresses.addressFallback")}
                      </Text>
                      {a.isDefault ? (
                        <Text className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary dark:bg-emerald-400/15 dark:text-emerald-300">
                          {t("savedAddresses.default")}
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
                    {t("savedAddresses.edit")}
                  </Button>
                  {!a.isDefault ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onPress={() => void setDefault(a.id)}
                      disabled={busyId === a.id}
                      loading={busyId === a.id}
                    >
                      {t("savedAddresses.makeDefault")}
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="ghost"
                    onPress={() => remove(a.id)}
                    disabled={busyId === a.id}
                  >
                    {t("savedAddresses.delete")}
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
          {t("savedAddresses.addNew")}
        </Button>
      </ScrollView>
    </Screen>
  );
}
