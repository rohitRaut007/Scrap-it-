import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
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

const timelineSteps: { status: OrderStatus; label: string }[] = [
  { status: "scheduled", label: "Scheduled" },
  { status: "assigned", label: "Driver assigned" },
  { status: "en_route", label: "On the way" },
  { status: "arriving", label: "Arriving" },
  { status: "completed", label: "Completed" },
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
  const [order, setOrder] = useState<PickupOrder | null | undefined>(
    undefined
  );

  useEffect(() => {
    void orderService.getById(orderId).then(setOrder);
  }, [orderId]);

  const rank = order ? statusRank(order.status) : -1;

  const timeline = useMemo(() => {
    if (!order) return null;
    return timelineSteps.map((step, i) => {
      const stepRank = statusRank(step.status);
      const done = rank >= stepRank && order.status !== "cancelled";
      const current = order.status === step.status;
      return { ...step, done, current, i };
    });
  }, [order, rank]);

  if (order === undefined) {
    return (
      <Screen>
        <AppHeader title="Order" onBack={() => router.back()} />
        <View className="flex-1 items-center justify-center">
          <Text variant="muted">Loading…</Text>
        </View>
      </Screen>
    );
  }

  if (order === null) {
    return (
      <Screen contentClassName="px-6">
        <AppHeader title="Order" onBack={() => router.back()} />
        <EmptyState title="Order not found" description="Check your history." />
      </Screen>
    );
  }

  return (
    <Screen contentClassName="px-5 pt-2">
      <AppHeader title={`#${order.id}`} onBack={() => router.back()} />
      <View className="mb-4 flex-row items-center justify-between">
        <Badge
          label={orderStatusLabel(order.status)}
          tone={orderStatusTone(order.status)}
        />
        {order.etaMinutes != null ? (
          <Text variant="muted" className="text-[13px]">
            ETA ~{order.etaMinutes} min
          </Text>
        ) : null}
      </View>

      <Card className="mb-5 min-h-[140px] items-center justify-center border-dashed bg-muted/40">
        <Text variant="muted" className="text-center text-[13px]">
          Map preview
        </Text>
        <Text variant="small" className="mt-1 text-center">
          Live tracking connects when backend is ready.
        </Text>
      </Card>

      <Text className="mb-3 text-[15px] font-semibold text-foreground">
        Timeline
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
                  Current step
                </Text>
              ) : null}
            </View>
          </View>
        ))}
      </Card>

      {order.driver ? (
        <Card className="mt-4">
          <Text variant="muted" className="text-[13px]">
            Driver
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
          Schedule another
        </Button>
      ) : null}
    </Screen>
  );
}
