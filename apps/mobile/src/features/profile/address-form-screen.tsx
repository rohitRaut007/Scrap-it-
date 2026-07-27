import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { AppHeader } from "@/components/layout/app-header";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";
import { addressService } from "@/services/addressService";
import type { AddressSummary } from "@/types/domain";

export interface AddressFormScreenProps {
  /** When set, screen loads the existing address and edits in place. */
  addressId?: string;
}

export function AddressFormScreen({ addressId }: AddressFormScreenProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const isEdit = Boolean(addressId);

  const describeError = useCallback(
    (err: unknown, fallback: string): string => {
      if (err instanceof ApiError) return `${err.message} (HTTP ${err.status})`;
      if (err instanceof Error) return err.message;
      return fallback;
    },
    [],
  );

  const [label, setLabel] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("IN");
  const [isDefault, setIsDefault] = useState(false);

  const [loadState, setLoadState] = useState<"pending" | "ok" | "error">(
    isEdit ? "pending" : "ok",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!addressId) return;
    setLoadState("pending");
    setError(null);
    try {
      const all = await addressService.list();
      const match = all.find((a) => a.id === addressId);
      if (!match) {
        setLoadState("error");
        setError(t("addressForm.notFound"));
        return;
      }
      hydrate(match);
      setLoadState("ok");
    } catch (e) {
      setError(describeError(e, t("addressForm.loadError")));
      setLoadState("error");
    }
  }, [addressId, describeError, t]);

  function hydrate(a: AddressSummary) {
    setLabel(a.label ?? "");
    setLine1(a.line1);
    setLine2(a.line2 ?? "");
    setCity(a.city);
    setRegion(a.region ?? "");
    setPostalCode(a.postalCode ?? "");
    setCountry(a.country || "IN");
    setIsDefault(a.isDefault === true);
  }

  useEffect(() => {
    if (isEdit) void load();
  }, [isEdit, load]);

  const save = useCallback(async () => {
    if (busy) return;
    if (!line1.trim() || !city.trim()) {
      setError(t("addressForm.requiredFieldsError"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload = {
        label: label.trim() || undefined,
        line1: line1.trim(),
        line2: line2.trim() || undefined,
        city: city.trim(),
        region: region.trim() || undefined,
        postalCode: postalCode.trim() || undefined,
        country: country.trim() || "IN",
        isDefault: isDefault || undefined,
      };
      if (isEdit && addressId) {
        await addressService.update(addressId, payload);
      } else {
        await addressService.create(payload);
      }
      router.back();
    } catch (e) {
      setError(describeError(e, t("addressForm.saveError")));
    } finally {
      setBusy(false);
    }
  }, [
    addressId,
    busy,
    city,
    country,
    describeError,
    isDefault,
    isEdit,
    label,
    line1,
    line2,
    postalCode,
    region,
    router,
    t,
  ]);

  const remove = useCallback(() => {
    if (!addressId || busy) return;
    Alert.alert(
      t("addressForm.deleteConfirmTitle"),
      t("addressForm.deleteConfirmBody"),
      [
        { text: t("addressForm.deleteConfirmCancel"), style: "cancel" },
        {
          text: t("addressForm.deleteConfirmAction"),
          style: "destructive",
          onPress: () => {
            setBusy(true);
            addressService
              .remove(addressId)
              .then(() => router.back())
              .catch((e) => setError(describeError(e, t("addressForm.deleteError"))))
              .finally(() => setBusy(false));
          },
        },
      ],
    );
  }, [addressId, busy, describeError, router, t]);

  return (
    <Screen>
      <AppHeader
        title={isEdit ? t("addressForm.editTitle") : t("addressForm.addTitle")}
        onBack={() => router.back()}
      />
      {loadState === "pending" ? (
        <View className="px-5 pt-4">
          <Skeleton className="mb-3 h-12 w-full rounded-xl" />
          <Skeleton className="mb-3 h-12 w-full rounded-xl" />
          <Skeleton className="mb-3 h-12 w-full rounded-xl" />
        </View>
      ) : loadState === "error" ? (
        <View className="flex-1 px-5 pt-4">
          <Text className="text-[14px] text-foreground">
            {error ?? t("addressForm.loadError")}
          </Text>
          <Button variant="outline" className="mt-4" onPress={() => void load()}>
            {t("addressForm.retry")}
          </Button>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <TextField
            label={t("addressForm.labelField")}
            value={label}
            onChangeText={setLabel}
            autoCapitalize="words"
            placeholder={t("addressForm.labelPlaceholder")}
            containerClassName="mb-3"
          />
          <TextField
            label={t("addressForm.line1Field")}
            value={line1}
            onChangeText={setLine1}
            autoCapitalize="words"
            containerClassName="mb-3"
          />
          <TextField
            label={t("addressForm.line2Field")}
            value={line2}
            onChangeText={setLine2}
            autoCapitalize="words"
            containerClassName="mb-3"
          />
          <TextField
            label={t("addressForm.cityField")}
            value={city}
            onChangeText={setCity}
            autoCapitalize="words"
            containerClassName="mb-3"
          />
          <TextField
            label={t("addressForm.regionField")}
            value={region}
            onChangeText={setRegion}
            autoCapitalize="words"
            containerClassName="mb-3"
          />
          <TextField
            label={t("addressForm.postalCodeField")}
            value={postalCode}
            onChangeText={setPostalCode}
            keyboardType="number-pad"
            containerClassName="mb-3"
          />
          <TextField
            label={t("addressForm.countryField")}
            value={country}
            onChangeText={(v) => setCountry(v.toUpperCase().slice(0, 2))}
            autoCapitalize="characters"
            containerClassName="mb-3"
          />
          <Button
            variant={isDefault ? "primary" : "outline"}
            className="mb-4"
            onPress={() => setIsDefault((v) => !v)}
          >
            {isDefault ? t("addressForm.defaultAddress") : t("addressForm.setDefault")}
          </Button>

          {error ? (
            <Text className="mb-3 text-[13px] text-destructive dark:text-red-400">
              {error}
            </Text>
          ) : null}

          <Button disabled={busy} loading={busy} onPress={() => void save()}>
            {isEdit ? t("addressForm.saveChanges") : t("addressForm.addAddress")}
          </Button>

          {isEdit ? (
            <Button
              variant="outline"
              className="mt-3"
              disabled={busy}
              onPress={remove}
            >
              {t("addressForm.deleteAddress")}
            </Button>
          ) : null}
        </ScrollView>
      )}
    </Screen>
  );
}
