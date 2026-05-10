export interface PickupTimeSlot {
  id: string;
  label: string;
  /** Local hour for range start (24h clock, whole hours). */
  startHour: number;
  /** Exclusive end hour for labeling; scheduling uses startHour as anchor. */
  endHour: number;
  /** Mock capacity flag until backend provides availability. */
  full?: boolean;
}

/** Stable ids for analytics and API mapping later. */
export const PICKUP_TIME_SLOTS: PickupTimeSlot[] = [
  {
    id: "morning",
    label: "9:00 AM – 11:00 AM",
    startHour: 9,
    endHour: 11,
  },
  {
    id: "midday",
    label: "11:00 AM – 1:00 PM",
    startHour: 11,
    endHour: 13,
  },
  {
    id: "afternoon",
    label: "1:00 PM – 3:00 PM",
    startHour: 13,
    endHour: 15,
    full: true,
  },
  {
    id: "late",
    label: "3:00 PM – 5:00 PM",
    startHour: 15,
    endHour: 17,
  },
];

export function getPickupTimeSlot(id: string): PickupTimeSlot | undefined {
  return PICKUP_TIME_SLOTS.find((s) => s.id === id);
}
