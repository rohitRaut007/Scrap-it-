import { cn } from "@/lib/utils";

export type StampTone = "rust" | "signal" | "cash" | "muted" | "destructive";

const STAMP_TONES: Record<StampTone, string> = {
  rust: "border-rust text-rust",
  signal: "border-signal text-rust-dark",
  cash: "border-cash text-cash",
  muted: "border-muted-foreground/40 text-muted-foreground",
  destructive: "border-destructive text-destructive",
};

interface StampProps {
  children: React.ReactNode;
  tone?: StampTone;
  className?: string;
}

/** Rotated, bordered rubber-stamp style badge — for order/invoice statuses. */
export function Stamp({ children, tone = "rust", className }: StampProps) {
  return (
    <span
      className={cn(
        "inline-block -rotate-2 border-2 bg-card px-2.5 py-1 font-mono text-[10px] font-bold tracking-wider uppercase",
        STAMP_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
