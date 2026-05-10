import { getPickupTimeSlot } from "@/features/pickup/constants/time-slots";

export function formatReviewSchedule(
  scheduledAtIso: string | null,
  timeSlotId: string | null,
): { title: string; subtitle: string } {
  if (!scheduledAtIso) {
    return { title: "Pick a date & time", subtitle: "" };
  }
  const start = new Date(scheduledAtIso);
  if (Number.isNaN(start.getTime())) {
    return { title: "Pick a date & time", subtitle: "" };
  }

  const title = start.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const slot = timeSlotId ? getPickupTimeSlot(timeSlotId) : undefined;
  const subtitle = slot?.label ?? start.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return { title, subtitle };
}
