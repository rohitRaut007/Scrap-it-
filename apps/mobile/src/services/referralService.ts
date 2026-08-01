import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "@/lib/storage-keys";

/**
 * Persists the collector slug from a scanned booking QR/link across the
 * login/signup hop — the deep link can land before the user is
 * authenticated, so the pickup flow reads this back once they are.
 */
export const referralService = {
  async setPendingSlug(slug: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.pendingCollectorSlug, slug);
  },

  async getPendingSlug(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.pendingCollectorSlug);
  },

  async clearPendingSlug(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.pendingCollectorSlug);
  },
};
