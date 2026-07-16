import { useCallback, useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { analyticsService } from "@/services/analyticsService";
import { categoryService } from "@/services/categoryService";
import { orderService } from "@/services/orderService";
import { userService } from "@/services/userService";
import type { AnalyticsSummary, Category, PickupOrder, User } from "@/types/domain";
import { displayNameFromUser } from "@/lib/displayName";
import { formatAddressSummary } from "@/lib/formatAddress";
import { useAppTheme } from "@/lib/theme";
import { orderStatusLabel } from "@/features/orders/order-status-label";

function formatPickupSummary(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Scheduled pickup";
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const categoryIcons: Record<
  string,
  keyof typeof Ionicons.glyphMap
> = {
  metal: "hardware-chip-outline",
  paper: "document-text-outline",
  plastic: "water-outline",
  electronics: "phone-portrait-outline",
  appliances: "tv-outline",
  glass: "wine-outline",
};

export function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const [user, setUser] = useState<User | null>(null);
  const [userLoad, setUserLoad] = useState<"pending" | "ok" | "error">("pending");
  const [impact, setImpact] = useState<AnalyticsSummary | null>(null);
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [active, setActive] = useState<PickupOrder | null | undefined>(
    undefined
  );

  const load = useCallback(async () => {
    setActive(undefined);
    setUserLoad("pending");
    setUser(null);

    const [catRes, orderRes, userRes, impactRes] = await Promise.allSettled([
      categoryService.list(),
      orderService.getActive(),
      userService.getCurrent(),
      analyticsService.getSummary(),
    ]);

    if (catRes.status === "fulfilled") {
      setCategories(catRes.value);
    } else {
      setCategories([]);
    }

    if (orderRes.status === "fulfilled") {
      setActive(orderRes.value);
    } else {
      setActive(null);
    }

    if (userRes.status === "fulfilled") {
      setUser(userRes.value);
      setUserLoad("ok");
    } else {
      setUserLoad("error");
    }

    if (impactRes.status === "fulfilled") {
      setImpact(impactRes.value);
    } else {
      setImpact({
        pickupsCompleted: 0,
        weightKgApprox: 0,
        estimatedPayoutInr: 0,
      });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onSchedule = () => router.push("/pickup");
  const onCategory = (id: string) =>
    router.push({ pathname: "/pickup", params: { categoryId: id } });
  const onTrack = (id: string) => router.push(`/order/${id}`);
  const featuredCategories = categories?.slice(0, 4) ?? [];

  const greetingName =
    userLoad === "ok" && user ? displayNameFromUser(user) : null;
  const addressLine =
    user?.defaultAddress != null
      ? formatAddressSummary(user.defaultAddress)
      : null;

  return (
    <Screen contentClassName="px-5 pt-2">
      {userLoad === "error" ? (
        <View className="mb-4 rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-3 dark:border-red-400/30 dark:bg-red-400/10">
          <Text className="text-[13px] text-foreground">
            {t("home.profileError")}
          </Text>
          <Pressable onPress={load} className="mt-2 self-start">
            <Text className="text-[13px] font-semibold text-primary dark:text-emerald-300">
              {t("home.retry")}
            </Text>
          </Pressable>
        </View>
      ) : null}
      <View className="mb-4 flex-row items-center justify-between">
        <View>
          <Text variant="small" className="text-[13px] font-medium">
            {t("home.greeting")}
          </Text>
          {userLoad === "pending" ? (
            <Skeleton className="mt-1 h-7 w-36" />
          ) : greetingName ? (
            <Text variant="title" className="text-[22px]">
              {greetingName} 👋
            </Text>
          ) : (
            <Text variant="title" className="text-[22px]">
              {t("home.greetingFallback")} 👋
            </Text>
          )}
          <Text variant="muted" className="mt-1 text-[13px]">
            {t("home.subGreeting")}
          </Text>
        </View>
        <Pressable className="size-10 items-center justify-center rounded-full bg-secondary/80 active:bg-secondary dark:bg-neutral-800 dark:active:bg-neutral-700">
          <Ionicons
            name="notifications-outline"
            size={18}
            color={colors.icon}
          />
          <View className="absolute right-2 top-2 size-1.5 rounded-full bg-primary ring-2 ring-background dark:bg-emerald-400 dark:ring-neutral-950" />
        </Pressable>
      </View>

      <Pressable
        onPress={addressLine ? undefined : onSchedule}
        className="mb-5 flex-row items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 active:bg-muted/80 dark:border-neutral-800 dark:bg-neutral-900 dark:active:bg-neutral-800"
      >
        <View className="flex-row flex-1 items-center gap-2 pr-2">
          <Ionicons name="location-outline" size={16} color={colors.icon} />
          <Text
            className="flex-1 font-medium text-[13px] text-foreground"
            numberOfLines={2}
          >
            {addressLine ?? t("home.addressPlaceholder")}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={16} color={colors.mutedForeground} />
      </Pressable>

      <View className="mb-5 flex-row gap-3">
        <Pressable
          onPress={onSchedule}
          className="flex-1 overflow-hidden rounded-3xl border border-primary/20 bg-primary/10 p-4 active:opacity-90 dark:border-emerald-400/20 dark:bg-emerald-400/10"
        >
          <Text className="text-base font-semibold text-foreground">
            {t("home.schedulePickup.title")}
          </Text>
          <Text variant="muted" className="mt-1 text-[12px]">
            {t("home.schedulePickup.subtitle")}
          </Text>
          <View className="mt-4 flex-row items-center justify-between">
            <View className="rounded-full bg-primary px-3 py-1.5 dark:bg-emerald-400">
              <Text className="text-[12px] font-semibold text-primary-foreground dark:text-emerald-950">
                {t("home.schedulePickup.cta")}
              </Text>
            </View>
            <View className="size-11 items-center justify-center rounded-2xl bg-primary/15 dark:bg-emerald-400/15">
              <Ionicons name="car-outline" size={22} color={colors.primary} />
            </View>
          </View>
        </Pressable>

        <Pressable
          onPress={() => (active ? onTrack(active.id) : router.push("/orders"))}
          className="flex-1 overflow-hidden rounded-3xl border border-border bg-card p-4 active:bg-muted/80 dark:border-neutral-800 dark:bg-neutral-900 dark:active:bg-neutral-800"
        >
          <Text className="text-base font-semibold text-foreground">{t("home.trackOrder.title")}</Text>
          <Text variant="muted" className="mt-1 text-[12px]">
            {t("home.trackOrder.subtitle")}
          </Text>
          <View className="mt-4 flex-row items-center justify-between">
            <View className="rounded-full bg-primary/10 px-3 py-1.5 dark:bg-emerald-400/10">
              <Text className="text-[12px] font-semibold text-primary dark:text-emerald-300">
                {t("home.trackOrder.cta")}
              </Text>
            </View>
            <View className="size-11 items-center justify-center rounded-2xl bg-secondary dark:bg-neutral-800">
              <Ionicons name="cube-outline" size={22} color={colors.icon} />
            </View>
          </View>
        </Pressable>
      </View>

      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-[15px] font-semibold text-foreground">
          {t("home.popularCategories")}
        </Text>
        <Pressable onPress={onSchedule}>
          <Text className="text-[12px] font-medium text-primary dark:text-emerald-300">
            {t("home.seeAll")}
          </Text>
        </Pressable>
      </View>
      {categories === null ? (
        <View className="mb-5 flex-row gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 flex-1 rounded-2xl" />
          ))}
        </View>
      ) : (
        <View className="mb-5 flex-row gap-2">
          {featuredCategories.map((cat) => {
            const icon = categoryIcons[cat.iconKey] ?? "cube-outline";
            return (
              <Pressable
                key={cat.id}
                onPress={() => onCategory(cat.id)}
                className="flex-1 items-center rounded-2xl border border-border bg-card px-2 py-3 active:bg-muted/80 dark:border-neutral-800 dark:bg-neutral-900 dark:active:bg-neutral-800"
              >
                <View className="mb-2 size-10 items-center justify-center rounded-xl bg-secondary dark:bg-neutral-800">
                  <Ionicons name={icon} size={18} color={colors.icon} />
                </View>
                <Text className="text-[11px] font-semibold text-foreground">
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-[15px] font-semibold text-foreground">
          {t("home.upcomingPickup")}
        </Text>
        {active ? (
          <Pressable onPress={() => onTrack(active.id)}>
            <Text className="text-[12px] font-medium text-primary dark:text-emerald-300">
              {t("home.viewDetails")}
            </Text>
          </Pressable>
        ) : null}
      </View>
      <Pressable
        onPress={() => (active ? onTrack(active.id) : onSchedule())}
        className="mb-5 rounded-3xl border border-border bg-card p-4 active:bg-muted/80 dark:border-neutral-800 dark:bg-neutral-900 dark:active:bg-neutral-800"
      >
        {active === undefined ? (
          <Skeleton className="h-20 w-full rounded-xl" />
        ) : active ? (
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="font-semibold text-foreground">
                {formatPickupSummary(active.scheduledAt)}
              </Text>
              <Text variant="muted" className="mt-1 text-[12px]">
                {t("home.itemsWeightSummary", {
                  count: (active.items?.length ?? active.categoryIds.length) || 0,
                  weight: (active.totalWeightKg ?? 0).toFixed(1),
                })}
              </Text>
              <View className="mt-3 self-start">
                <Text className="rounded-full bg-primary/10 px-3 py-1.5 text-[12px] font-semibold text-primary dark:bg-emerald-400/10 dark:text-emerald-300">
                  {orderStatusLabel(active.status, t)}
                </Text>
              </View>
            </View>
            <View className="size-14 items-center justify-center rounded-2xl bg-primary/10 dark:bg-emerald-400/10">
              <Ionicons name="car-sport-outline" size={26} color={colors.primary} />
            </View>
          </View>
        ) : (
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="font-semibold text-foreground">{t("home.noPickupScheduled")}</Text>
              <Text variant="muted" className="mt-1 text-[12px]">
                {t("home.noPickupSubtitle")}
              </Text>
            </View>
            <View className="size-12 items-center justify-center rounded-2xl bg-secondary dark:bg-neutral-800">
              <Ionicons name="calendar-outline" size={22} color={colors.icon} />
            </View>
          </View>
        )}
      </Pressable>

      <Card className="rounded-3xl border-primary/10 bg-primary/5 dark:border-emerald-400/20 dark:bg-emerald-400/5">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-[15px] font-semibold text-foreground">
              {t("home.yourImpact")}
            </Text>
            <Text variant="muted" className="mt-1 text-[12px]">
              {t("home.impactSubtitle")}
            </Text>
            <View className="mt-4 flex-row flex-wrap gap-5">
              <View>
                <Text className="text-lg font-bold text-foreground">
                  {impact?.pickupsCompleted ?? 0}
                </Text>
                <Text variant="small">{t("home.pickups")}</Text>
              </View>
              <View>
                <Text className="text-lg font-bold text-foreground">
                  {(impact?.weightKgApprox ?? 0).toFixed(1)} kg
                </Text>
                <Text variant="small">{t("home.wasteCollected")}</Text>
              </View>
              <View>
                <Text className="text-lg font-bold text-foreground">
                  ₹{impact?.estimatedPayoutInr ?? 0}
                </Text>
                <Text variant="small">{t("home.estPayout")}</Text>
              </View>
            </View>
          </View>
          <View className="size-16 items-center justify-center rounded-2xl bg-primary/10 dark:bg-emerald-400/10">
            <Ionicons name="leaf-outline" size={30} color={colors.primary} />
          </View>
        </View>
      </Card>

      <View className="h-6" />
    </Screen>
  );
}
