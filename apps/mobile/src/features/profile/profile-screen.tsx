import { useCallback, useState } from "react";
import { Pressable, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { analyticsService } from "@/services/analyticsService";
import { authService } from "@/services/authService";
import { userService } from "@/services/userService";
import type { AnalyticsSummary, User } from "@/types/domain";
import { displayNameFromUser } from "@/lib/displayName";
import { openSupportContact } from "@/lib/support";
import { useAppTheme } from "@/lib/theme";

function Row({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center justify-between border-b border-border py-4 active:bg-muted/50 dark:border-neutral-800 dark:active:bg-neutral-800/70"
    >
      <View className="flex-row items-center gap-3">
        <Ionicons name={icon} size={20} color={colors.subtleIcon} />
        <Text className="text-[15px] text-foreground">{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.subtleIcon} />
    </Pressable>
  );
}

export function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const [user, setUser] = useState<User | null>(null);
  const [userLoad, setUserLoad] = useState<"pending" | "ok" | "error">("pending");
  const [stats, setStats] = useState<AnalyticsSummary | null>(null);
  const [statsError, setStatsError] = useState(false);

  const load = useCallback(async () => {
    setUserLoad("pending");
    setUser(null);
    setStatsError(false);
    setStats(null);

    const [userResult, statsResult] = await Promise.allSettled([
      userService.getCurrent(),
      analyticsService.getSummary(),
    ]);

    if (userResult.status === "fulfilled") {
      setUser(userResult.value);
      setUserLoad("ok");
    } else {
      setUserLoad("error");
    }

    if (statsResult.status === "fulfilled") {
      setStats(statsResult.value);
      setStatsError(false);
    } else {
      setStats(null);
      setStatsError(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const logout = async () => {
    await authService.signOut();
    router.replace("/(auth)/login");
  };

  return (
    <Screen contentClassName="px-5 pt-4">
      <Text variant="title" className="mb-1">
        {t("profile.title")}
      </Text>
      <Text variant="muted" className="mb-6 text-[14px]">
        {t("profile.subtitle")}
      </Text>

      {userLoad === "pending" ? (
        <Card className="mb-6">
          <Skeleton className="h-6 w-40 rounded-md" />
          <Skeleton className="mt-3 h-4 w-full max-w-[220px] rounded-md" />
          <Skeleton className="mt-2 h-4 w-32 rounded-md" />
        </Card>
      ) : userLoad === "error" ? (
        <Card className="mb-6 border-destructive/25 dark:border-red-400/30">
          <Text className="text-[14px] text-foreground">
            {t("profile.loadError")}
          </Text>
          <Pressable onPress={load} className="mt-3 self-start">
            <Text className="text-[14px] font-semibold text-primary dark:text-emerald-300">
              {t("profile.retry")}
            </Text>
          </Pressable>
        </Card>
      ) : user ? (
        <Card className="mb-6">
          <Text className="text-lg font-semibold text-foreground">
            {displayNameFromUser(user)}
          </Text>
          {!user.name?.trim() ? (
            <Text variant="muted" className="mt-1 text-[12px] italic opacity-80">
              {t("profile.addName")}
            </Text>
          ) : null}
          <Text variant="muted" className="mt-1 text-[13px]">
            {user.email || t("profile.noEmail")}
          </Text>
          <Text
            variant="muted"
            className={`mt-2 text-[13px] ${!user.phone?.trim() ? "italic opacity-80" : ""}`}
          >
            {user.phone?.trim() ? user.phone : t("profile.addPhone")}
          </Text>
        </Card>
      ) : null}

      {userLoad === "pending" ? (
        <Card className="mb-6">
          <Skeleton className="h-4 w-28 rounded-md" />
          <View className="mt-4 flex-row gap-4">
            <View className="flex-1">
              <Skeleton className="h-3 w-14 rounded-md" />
              <Skeleton className="mt-2 h-8 w-10 rounded-md" />
            </View>
            <View className="flex-1">
              <Skeleton className="h-3 w-12 rounded-md" />
              <Skeleton className="mt-2 h-8 w-14 rounded-md" />
            </View>
            <View className="flex-1">
              <Skeleton className="h-3 w-16 rounded-md" />
              <Skeleton className="mt-2 h-8 w-12 rounded-md" />
            </View>
          </View>
        </Card>
      ) : statsError ? (
        <View className="mb-6 rounded-2xl border border-border bg-card px-4 py-3 dark:border-neutral-800">
          <Text className="text-[13px] text-foreground">{t("profile.statsLoadError")}</Text>
          <Pressable onPress={load} className="mt-2 self-start">
            <Text className="text-[13px] font-semibold text-primary dark:text-emerald-300">
              {t("profile.retry")}
            </Text>
          </Pressable>
        </View>
      ) : stats ? (
        <Card className="mb-6">
          <Text className="mb-4 text-[15px] font-semibold text-foreground">{t("profile.yourImpact")}</Text>
          <View className="flex-row flex-wrap justify-between gap-y-4">
            <View className="min-w-[28%] flex-1">
              <Text variant="label">{t("profile.pickups")}</Text>
              <Text className="mt-2 text-2xl font-bold text-foreground">
                {stats.pickupsCompleted}
              </Text>
            </View>
            <View className="min-w-[28%] flex-1">
              <Text variant="label">{t("profile.waste")}</Text>
              <Text className="mt-2 text-2xl font-bold text-foreground">
                {stats.weightKgApprox.toFixed(1)} kg
              </Text>
            </View>
            <View className="min-w-[28%] flex-1">
              <Text variant="label">{t("profile.estPayout")}</Text>
              <Text className="mt-2 text-2xl font-bold text-primary dark:text-emerald-300">
                ₹{stats.estimatedPayoutInr}
              </Text>
            </View>
          </View>
        </Card>
      ) : null}

      <Card className="overflow-hidden px-0 py-0">
        <View className="px-4">
          <ThemeToggle />
          <LanguageToggle />
          <Row
            icon="person-outline"
            label={t("profile.editProfile")}
            onPress={() => router.push("/edit-profile")}
          />
          <Row
            icon="location-outline"
            label={t("profile.savedAddresses")}
            onPress={() => router.push("/saved-addresses")}
          />
          <Row
            icon="help-circle-outline"
            label={t("profile.helpSupport")}
            onPress={() => void openSupportContact()}
          />
        </View>
      </Card>

      <Pressable
        onPress={logout}
        className="mt-6 flex-row items-center justify-center gap-2 rounded-xl border border-destructive/30 py-3.5 active:bg-destructive/5 dark:border-red-400/30 dark:active:bg-red-400/10"
      >
        <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
        <Text className="font-semibold text-destructive dark:text-red-400">
          {t("profile.logOut")}
        </Text>
      </Pressable>
    </Screen>
  );
}
