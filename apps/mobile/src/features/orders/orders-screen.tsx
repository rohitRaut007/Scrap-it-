import { useCallback, useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { orderService } from "@/services/orderService";
import type { PickupOrder } from "@/types/domain";
import { orderStatusLabel, orderStatusTone } from "./order-status-label";

export function OrdersScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [orders, setOrders] = useState<PickupOrder[] | null>(null);

  const load = useCallback(async () => {
    const list = await orderService.list();
    setOrders(list);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen contentClassName="px-5 pt-4">
      <Text variant="title" className="mb-1">
        {t("orders.title")}
      </Text>
      <Text variant="muted" className="mb-5 text-[14px]">
        {t("orders.subtitle")}
      </Text>

      {orders === null ? (
        <View className="gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </View>
      ) : orders.length === 0 ? (
        <EmptyState
          title={t("orders.emptyTitle")}
          description={t("orders.emptyDescription")}
        />
      ) : (
        <View className="gap-3">
          {orders.map((o) => (
            <Pressable key={o.id} onPress={() => router.push(`/order/${o.id}`)}>
              <Card className="active:bg-muted/40">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="font-semibold text-foreground">#{o.id}</Text>
                    <Text variant="muted" className="mt-1 text-[13px]">
                      {new Date(o.scheduledAt).toLocaleString()}
                    </Text>
                    <Text variant="muted" className="mt-1 text-[13px]" numberOfLines={1}>
                      {o.addressLine}
                    </Text>
                  </View>
                  <Badge
                    label={orderStatusLabel(o.status, t)}
                    tone={orderStatusTone(o.status)}
                  />
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}
