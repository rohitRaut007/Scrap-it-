/** Local calendar key YYYY-MM-DD */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [ys, ms, ds] = key.split("-");
  const y = Number(ys);
  const m = Number(ms);
  const d = Number(ds);
  return new Date(y, m - 1, d);
}

/** Next `count` calendar days starting from `start` (local). */
export function upcomingDateKeys(start: Date, count: number): string[] {
  const keys: string[] = [];
  const cursor = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  );
  for (let i = 0; i < count; i += 1) {
    keys.push(toDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
}

export function formatScheduleDateHeading(key: string, now: Date): string {
  const d = parseDateKey(key);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function buildLocalScheduledIso(dateKey: string, startHour: number): string {
  const base = parseDateKey(dateKey);
  const scheduled = new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate(),
    startHour,
    0,
    0,
    0,
  );
  return scheduled.toISOString();
}
