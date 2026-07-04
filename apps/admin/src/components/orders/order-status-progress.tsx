"use client";

import { Fragment } from "react";
import {
  Package,
  UserCheck,
  Truck,
  MapPin,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimelineEntry } from "@/hooks/use-orders";

interface Step {
  key: string;
  label: string;
  Icon: LucideIcon;
  eventType: string;
}

const STEPS: Step[] = [
  { key: "scheduled", label: "Scheduled", Icon: Package,       eventType: "created"   },
  { key: "assigned",  label: "Assigned",  Icon: UserCheck,     eventType: "assigned"  },
  { key: "en_route",  label: "En Route",  Icon: Truck,         eventType: "en_route"  },
  { key: "arriving",  label: "Arriving",  Icon: MapPin,        eventType: "arriving"  },
  { key: "completed", label: "Done",      Icon: CheckCircle2,  eventType: "completed" },
];

const STATUS_INDEX: Record<string, number> = {
  scheduled: 0,
  assigned:  1,
  en_route:  2,
  arriving:  3,
  completed: 4,
};

interface OrderStatusProgressProps {
  status: string;
  timeline: TimelineEntry[];
}

export function OrderStatusProgress({ status, timeline }: OrderStatusProgressProps) {
  const isCancelled = status === "cancelled";

  // For cancelled orders, find the highest step index that has a matching timeline event
  const lastReachedIndex = isCancelled
    ? STEPS.reduce((max, step, i) => {
        const hit = timeline.some((e) => e.eventType === step.eventType);
        return hit ? i : max;
      }, -1)
    : (STATUS_INDEX[status] ?? 0);

  const currentIndex = isCancelled ? lastReachedIndex : STATUS_INDEX[status] ?? 0;

  return (
    <div className="py-4">
      <div className="flex items-start">
        {STEPS.map((step, i) => {
          const reached = i <= lastReachedIndex;
          const active = !isCancelled && i === currentIndex;

          const circleClass = cn(
            "w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 transition-colors duration-200",
            isCancelled
              ? reached
                ? "bg-muted border-muted-foreground/40"
                : "bg-background border-border"
              : reached
              ? active
                ? "bg-primary border-primary"
                : "bg-primary border-primary"
              : "bg-background border-border",
          );

          const iconClass = cn(
            "transition-colors duration-200",
            isCancelled
              ? reached
                ? "text-muted-foreground"
                : "text-border"
              : reached
              ? "text-primary-foreground"
              : "text-border",
          );

          const labelClass = cn(
            "mt-2 text-xs text-center leading-tight transition-colors duration-200 w-14",
            isCancelled
              ? reached
                ? "text-muted-foreground"
                : "text-muted-foreground/50"
              : reached
              ? active
                ? "text-foreground font-medium"
                : "text-foreground"
              : "text-muted-foreground/50",
          );

          const lineClass = cn(
            "flex-1 h-[2px] mt-[9px] transition-colors duration-200",
            isCancelled
              ? i < lastReachedIndex
                ? "bg-muted-foreground/40"
                : "bg-border"
              : i < currentIndex
              ? "bg-primary"
              : "bg-border",
          );

          return (
            <Fragment key={step.key}>
              <div className="flex flex-col items-center">
                <div className={circleClass}>
                  <step.Icon size={10} className={iconClass} />
                </div>
                <span className={labelClass}>{step.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={lineClass} />}
            </Fragment>
          );
        })}
      </div>

      {isCancelled && lastReachedIndex >= 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          Cancelled after reaching{" "}
          <span className="font-medium">{STEPS[lastReachedIndex].label}</span>.
        </p>
      )}
    </div>
  );
}
