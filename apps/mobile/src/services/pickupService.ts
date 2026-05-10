import type { PickupOrder } from "@/types/domain";
import { orderService } from "./orderService";

export type SchedulePickupInput = {
  categoryIds: string[];
  addressId: string;
  scheduledAt: string;
  photoStorageKeys?: string[];
  notes?: string;
};

export const pickupService = {
  async schedulePickup(input: SchedulePickupInput): Promise<PickupOrder> {
    return orderService.create(input);
  },
};
