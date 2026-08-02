import { cn } from "@/lib/utils";
import { DoubleRule } from "@/components/ui/double-rule";

interface SectionEyebrowProps {
  label: string;
  dateline?: string;
  className?: string;
}

/** Mono-caps section label + optional dateline + a DoubleRule beneath —
 *  the recurring page-masthead header used at the top of every portal page. */
export function SectionEyebrow({ label, dateline, className }: SectionEyebrowProps) {
  return (
    <div className={cn(className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pb-2.5">
        <span className="font-mono text-xs font-semibold tracking-[0.2em] text-rust uppercase">
          {label}
        </span>
        {dateline && (
          <span className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
            {dateline}
          </span>
        )}
      </div>
      <DoubleRule />
    </div>
  );
}
