import { useCallback, useEffect, useRef } from "react";
import { ActivityIndicator, Alert, Pressable, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { useAppTheme } from "@/lib/theme";
import { uploadsService } from "@/services/uploadsService";
import type { PickupPhoto } from "@/features/pickup/types/pickup-flow";

const MAX_PHOTOS = 6;

export interface PhotosStepProps {
  photos: PickupPhoto[];
  onChangePhotos: (photos: PickupPhoto[]) => void;
}

type ImagePickerAsset = {
  uri: string;
  fileSize?: number | null;
  mimeType?: string | null;
};

export function PhotosStep({ photos, onChangePhotos }: PhotosStepProps) {
  const { colors } = useAppTheme();

  // Keep a ref in sync with the latest photos so async upload callbacks can
  // produce new arrays based on current state instead of the snapshot they
  // closed over.
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  const updateByUri = useCallback(
    (uri: string, mutate: (p: PickupPhoto) => PickupPhoto) => {
      const next = photosRef.current.map((p) =>
        p.uri === uri ? mutate(p) : p,
      );
      photosRef.current = next;
      onChangePhotos(next);
    },
    [onChangePhotos],
  );

  const startUpload = useCallback(
    (uri: string, asset: ImagePickerAsset) => {
      const contentLength = asset.fileSize ?? 1;
      uploadsService
        .uploadOrderPhoto({
          uri,
          contentType: asset.mimeType ?? null,
          contentLength,
        })
        .then((signed) => {
          updateByUri(uri, (p) => ({
            ...p,
            storageKey: signed.storageKey,
            status: "uploaded",
            error: undefined,
          }));
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : "Upload failed";
          updateByUri(uri, (p) => ({
            ...p,
            status: "error",
            error: message,
          }));
        });
    },
    [updateByUri],
  );

  const addPhotos = useCallback(async () => {
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) return;

    let ImagePicker: typeof import("expo-image-picker");
    try {
      ImagePicker = await import("expo-image-picker");
    } catch {
      Alert.alert(
        "Photos unavailable",
        "Photo picking needs a native build that includes expo-image-picker. Run a new Android/iOS build (e.g. expo run:android) or rebuild your dev client.",
      );
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Photos access needed",
          "Allow photo library access to attach reference images for your pickup.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: 0.85,
      });

      if (result.canceled) return;

      const newAssets = result.assets.slice(0, remaining);
      const newPhotos: PickupPhoto[] = newAssets.map((a) => ({
        uri: a.uri,
        storageKey: null,
        status: "uploading",
      }));
      const next = [...photos, ...newPhotos].slice(0, MAX_PHOTOS);
      photosRef.current = next;
      onChangePhotos(next);

      for (const asset of newAssets) {
        startUpload(asset.uri, asset);
      }
    } catch (error) {
      console.warn("expo-image-picker failed", error);
      Alert.alert(
        "Photos unavailable",
        "Rebuild your development client so expo-image-picker native code is included, then try again.",
      );
    }
  }, [onChangePhotos, photos, startUpload]);

  const removeAt = useCallback(
    (index: number) => {
      const next = photos.filter((_, i) => i !== index);
      photosRef.current = next;
      onChangePhotos(next);
    },
    [onChangePhotos, photos],
  );

  const retry = useCallback(
    (photo: PickupPhoto) => {
      updateByUri(photo.uri, (p) => ({
        ...p,
        status: "uploading",
        error: undefined,
        storageKey: null,
      }));
      startUpload(photo.uri, { uri: photo.uri });
    },
    [startUpload, updateByUri],
  );

  return (
    <View>
      <Text variant="title" className="mb-1 text-[22px]">
        Add photos
      </Text>
      <Text variant="muted" className="mb-4 text-[15px]">
        Optional – helps us estimate better
      </Text>

      <View className="flex-row flex-wrap gap-2">
        {photos.map((photo, index) => (
          <View key={`${photo.uri}-${index}`} className="relative">
            <Image
              source={{ uri: photo.uri }}
              className="size-[104] rounded-2xl"
              contentFit="cover"
              transition={120}
            />
            {photo.status === "uploading" ? (
              <View className="absolute inset-0 items-center justify-center rounded-2xl bg-black/35">
                <ActivityIndicator color="#ffffff" />
              </View>
            ) : null}
            {photo.status === "error" ? (
              <Pressable
                onPress={() => retry(photo)}
                className="absolute inset-0 items-center justify-center rounded-2xl bg-red-600/80"
              >
                <Ionicons name="refresh" size={22} color="#ffffff" />
                <Text className="mt-1 text-[10px] text-white">Retry</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => removeAt(index)}
              hitSlop={10}
              className="absolute right-1 top-1 size-7 items-center justify-center rounded-full bg-black/55"
            >
              <Ionicons name="close" size={16} color="#ffffff" />
            </Pressable>
          </View>
        ))}

        {photos.length < MAX_PHOTOS ? (
          <Pressable
            onPress={() => void addPhotos()}
            className="size-[104] items-center justify-center rounded-2xl border border-dashed border-border bg-card dark:border-neutral-700 dark:bg-neutral-900"
          >
            <View className="mb-1 size-11 items-center justify-center rounded-full bg-primary/15 dark:bg-emerald-400/15">
              <Ionicons name="camera-outline" size={22} color={colors.primary} />
            </View>
            <Text variant="muted" className="text-[12px] font-medium">
              Add photo
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View className="mt-5 flex-row gap-3 rounded-2xl border border-border bg-muted/40 p-3 dark:border-neutral-800 dark:bg-neutral-900/80">
        <View className="size-9 items-center justify-center rounded-full bg-primary/15 dark:bg-emerald-400/15">
          <Ionicons name="information-circle" size={22} color={colors.primary} />
        </View>
        <Text variant="muted" className="flex-1 text-[13px] leading-snug">
          Clear photos help us provide accurate estimates.
        </Text>
      </View>
    </View>
  );
}
