import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { AppHeader } from "@/components/layout/app-header";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Screen } from "@/components/ui/screen";
import { orderService } from "@/services/orderService";
import type { OrderStatus, PickupOrder } from "@/types/domain";
import { orderStatusLabel, orderStatusTone } from "./order-status-label";

const timelineStatuses: OrderStatus[] = [
  "scheduled",
  "assigned",
  "en_route",
  "arriving",
  "completed",
];

function statusRank(status: OrderStatus): number {
  const order: OrderStatus[] = [
    "scheduled",
    "assigned",
    "en_route",
    "arriving",
    "completed",
    "cancelled",
  ];
  return order.indexOf(status);
}

export function OrderDetailScreen({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [order, setOrder] = useState<PickupOrder | null | undefined>(
    undefined
  );

  useEffect(() => {
    void orderService.getById(orderId).then(setOrder);
  }, [orderId]);

  const rank = order ? statusRank(order.status) : -1;

  const timeline = useMemo(() => {
    if (!order) return null;
    return timelineStatuses.map((status, i) => {
      const stepRank = statusRank(status);
      const done = rank >= stepRank && order.status !== "cancelled";
      const current = order.status === status;
      return {
        status,
        label: t(`orders.detail.timelineSteps.${status}`),
        done,
        current,
        i,
      };
    });
  }, [order, rank, t]);

  if (order === undefined) {
    return (
      <Screen>
        <AppHeader title={t("orders.detail.headerTitle")} onBack={() => router.back()} />
        <View className="flex-1 items-center justify-center">
          <Text variant="muted">{t("orders.detail.loading")}</Text>
        </View>
      </Screen>
    );
  }

  if (order === null) {
    return (
      <Screen contentClassName="px-6">
        <AppHeader title={t("orders.detail.headerTitle")} onBack={() => router.back()} />
        <EmptyState
          title={t("orders.detail.notFoundTitle")}
          description={t("orders.detail.notFoundDescription")}
        />
      </Screen>
    );
  }

  return (
    <Screen contentClassName="px-5 pt-2">
      <AppHeader title={`#${order.id}`} onBack={() => router.back()} />
      <View className="mb-4 flex-row items-center justify-between">
        <Badge
          label={orderStatusLabel(order.status, t)}
          tone={orderStatusTone(order.status)}
        />
        {order.etaMinutes != null ? (
          <Text variant="muted" className="text-[13px]">
            {t("orders.detail.eta", { minutes: order.etaMinutes })}
          </Text>
        ) : null}
      </View>

      <Card className="mb-5 min-h-[140px] items-center justify-center border-dashed bg-muted/40">
        <Text variant="muted" className="text-center text-[13px]">
          {t("orders.detail.mapPreview")}
        </Text>
        <Text variant="small" className="mt-1 text-center">
          {t("orders.detail.mapPreviewSubtitle")}
        </Text>
      </Card>

      <Text className="mb-3 text-[15px] font-semibold text-foreground">
        {t("orders.detail.timeline")}
      </Text>
      <Card className="gap-0 py-2">
        {timeline?.map((row) => (
          <View
            key={row.status}
            className="flex-row gap-3 border-b border-border/60 py-3 last:border-b-0"
          >
            <View
              className={`mt-1 size-2.5 rounded-full ${
                row.done
                  ? "bg-primary dark:bg-emerald-400"
                  : "bg-muted-foreground/30 dark:bg-neutral-700"
              }`}
            />
            <View className="flex-1">
              <Text
                className={`text-[14px] font-medium ${
                  row.current
                    ? "text-primary dark:text-emerald-300"
                    : "text-foreground dark:text-neutral-100"
                }`}
              >
                {row.label}
              </Text>
              {row.current ? (
                <Text variant="muted" className="mt-0.5 text-[12px]">
                  {t("orders.detail.currentStep")}
                </Text>
              ) : null}
            </View>
          </View>
        ))}
      </Card>

      {order.driver ? (
        <Card className="mt-4">
          <Text variant="muted" className="text-[13px]">
            {t("orders.detail.driver")}
          </Text>
          <Text className="mt-1 font-semibold text-foreground">
            {order.driver.name}
          </Text>
          <Text variant="muted" className="mt-0.5 text-[13px]">
            ★ {order.driver.rating.toFixed(1)}
          </Text>
        </Card>
      ) : null}

      <Text variant="muted" className="mt-4 text-[13px]">
        {order.addressLine}
      </Text>

      {order.status === "completed" ? (
        <Button
          className="mt-8"
          variant="secondary"
          onPress={() => router.replace("/pickup")}
        >
          {t("orders.detail.scheduleAnother")}
        </Button>
      ) : null}
    </Screen>
  );
}
