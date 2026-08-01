import { ApiError, api } from "@/lib/api";

/** Mirrors PublicCollectorProfileDto in apps/backend — the public `/book/:slug` lookup. */
export type PublicCollectorProfile = {
  name: string | null;
  rating: number | null;
  serviceArea: string | null;
  bookingSlug: string;
};

export const collectorLookupService = {
  /** Never throws — an unknown/inactive slug just resolves to null. */
  async bySlug(slug: string): Promise<PublicCollectorProfile | null> {
    try {
      return await api.get<PublicCollectorProfile>(
        `/public/collectors/${encodeURIComponent(slug)}`,
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }
  },
};
