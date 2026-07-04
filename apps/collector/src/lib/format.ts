const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export function formatInr(amount: number | null | undefined): string {
  if (amount == null) return "₹0";
  return `₹${inr.format(Math.round(amount))}`;
}

export function formatWeight(kg: number | null | undefined): string {
  if (kg == null) return "—";
  return `${kg % 1 === 0 ? kg : kg.toFixed(1)} kg`;
}

export function formatScheduledAt(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86_400_000);

  const time = d.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  if (diffDays === 0) return `Today, ${time}`;
  if (diffDays === 1) return `Tomorrow, ${time}`;
  if (diffDays === -1) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}, ${time}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** "Mon", "Tue" … from a yyyy-mm-dd key. */
export function weekdayShort(dateKey: string): string {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
  });
}

export function firstName(name: string | null | undefined): string {
  if (!name) return "Collector";
  return name.trim().split(/\s+/)[0];
}

export function initials(name: string | null | undefined, fallback = "C"): string {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || fallback;
}
