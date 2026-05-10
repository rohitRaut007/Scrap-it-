import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { AppHeader } from "@/components/layout/app-header";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { userService } from "@/services/userService";

function describeError(err: unknown): string {
  if (err instanceof ApiError) return `Backend ${err.status}: ${err.message}`;
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}

export function EditProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loadState, setLoadState] = useState<"pending" | "ok" | "error">("pending");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadState("pending");
    setError(null);
    try {
      const u = await userService.getCurrent();
      setName(u.name?.trim() ?? "");
      setPhone(u.phone?.trim() ?? "");
      setLoadState("ok");
    } catch {
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (busy || loadState !== "ok") return;
    setBusy(true);
    setError(null);
    try {
      await userService.updateCurrent({
        name: name.trim(),
        phone: phone.trim(),
      });
      router.back();
    } catch (e) {
      setError(describeError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <AppHeader title="Edit profile" onBack={() => router.back()} />
      {loadState === "error" ? (
        <View className="flex-1 px-5 pt-4">
          <Text className="text-[14px] text-foreground">
            Couldn&apos;t load your profile. Check your connection and try again.
          </Text>
          <Button variant="outline" className="mt-4" onPress={() => void load()}>
            Retry
          </Button>
        </View>
      ) : (
        <View className="flex-1 px-5 pt-4">
          <Text variant="muted" className="mb-4 text-[14px]">
            Your name and phone appear on pickups and receipts.
          </Text>
          <TextField
            label="Name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            editable={loadState === "ok" && !busy}
            containerClassName="mb-3"
          />
          <TextField
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            editable={loadState === "ok" && !busy}
            containerClassName="mb-2"
          />
          {error ? (
            <Text className="mb-3 text-[13px] text-destructive dark:text-red-400">
              {error}
            </Text>
          ) : null}
          <Button
            disabled={loadState !== "ok" || busy}
            loading={busy}
            onPress={() => void save()}
          >
            Save changes
          </Button>
        </View>
      )}
    </Screen>
  );
}
