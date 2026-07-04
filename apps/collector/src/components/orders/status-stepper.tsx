import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/order-utils";

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: "assigned", label: "Accepted" },
  { status: "en_route", label: "On the way" },
  { status: "arriving", label: "Arriving" },
  { status: "completed", label: "Done" },
];

export function StatusStepper({ status }: { status: OrderStatus }) {
  if (status === "cancelled" || status === "scheduled") return null;
  const currentIndex = STEPS.findIndex((s) => s.status === status);

  return (
    <div className="flex items-center">
      {STEPS.map((step, i) => {
        const done = i < currentIndex || status === "completed";
        const current = i === currentIndex && status !== "completed";
        return (
          <div key={step.status} className={cn("flex items-center", i > 0 && "flex-1")}>
            {i > 0 && (
              <div
                className={cn(
                  "h-0.5 flex-1 rounded-full",
                  done || current ? "bg-primary" : "bg-border",
                )}
              />
            )}
            <div className="flex flex-col items-center gap-1 px-1">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border-2 text-[11px] font-bold transition-colors",
                  done && "border-primary bg-primary text-primary-foreground",
                  current && "border-primary bg-primary/10 text-primary",
                  !done && !current && "border-border bg-card text-muted-foreground",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span
                className={cn(
                  "whitespace-nowrap text-[10px] font-medium",
                  done || current ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
