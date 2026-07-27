import { useEffect, useMemo, useState } from "react";
import { Alert, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { AppHeader } from "@/components/layout/app-header";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Screen } from "@/components/ui/screen";
import { ApiError } from "@/lib/api";
import { orderService } from "@/services/orderService";
import type { OrderStatus, PickupOrder } from "@/types/domain";
import { orderStatusLabel, orderStatusTone } from "./order-status-label";
import { RatePickupModal } from "./rate-pickup-modal";

const CANCELLABLE_STATUSES: OrderStatus[] = ["scheduled", "assigned"];

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
  const [cancelling, setCancelling] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    void orderService.getById(orderId).then(setOrder);
  }, [orderId]);

  const handleCancel = () => {
    Alert.alert(
      t("orders.detail.cancelConfirmTitle"),
      t("orders.detail.cancelConfirmBody"),
      [
        { text: t("orders.detail.cancelConfirmKeep"), style: "cancel" },
        {
          text: t("orders.detail.cancelConfirmAction"),
          style: "destructive",
          onPress: async () => {
            setCancelling(true);
            try {
              const updated = await orderService.cancel(orderId);
              setOrder(updated);
            } catch (e) {
              const message =
                e instanceof ApiError
                  ? e.message
                  : t("orders.detail.cancelGenericError");
              Alert.alert(t("orders.detail.cancelErrorTitle"), message);
            } finally {
              setCancelling(false);
            }
          },
        },
      ],
    );
  };

  const handleSubmitRating = async (score: number, comment?: string) => {
    setSubmittingRating(true);
    try {
      await orderService.rate(orderId, score, comment);
      setOrder((prev) => (prev ? { ...prev, hasRating: true } : prev));
      setRatingModalVisible(false);
    } catch (e) {
      const message =
        e instanceof ApiError ? e.message : t("orders.detail.rating.genericError");
      Alert.alert(t("orders.detail.rating.errorTitle"), message);
    } finally {
      setSubmittingRating(false);
    }
  };

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
        <>
          {order.hasRating ? (
            <Text variant="muted" className="mt-6 text-center text-[13px]">
              {t("orders.detail.rating.thanks")}
            </Text>
          ) : (
            <Button
              className="mt-6"
              variant="outline"
              onPress={() => setRatingModalVisible(true)}
            >
              {t("orders.detail.rating.cta")}
            </Button>
          )}
          <Button
            className="mt-3"
            variant="secondary"
            onPress={() => router.replace("/pickup")}
          >
            {t("orders.detail.scheduleAnother")}
          </Button>
        </>
      ) : null}

      {CANCELLABLE_STATUSES.includes(order.status) ? (
        <Button
          className="mt-8"
          variant="outline"
          onPress={handleCancel}
          disabled={cancelling}
          loading={cancelling}
        >
          {t("orders.detail.cancelPickup")}
        </Button>
      ) : null}

      <RatePickupModal
        visible={ratingModalVisible}
        submitting={submittingRating}
        onSubmit={handleSubmitRating}
        onClose={() => setRatingModalVisible(false)}
      />
    </Screen>
  );
}
