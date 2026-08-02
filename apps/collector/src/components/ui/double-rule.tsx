import { cn } from "@/lib/utils";

/** The 2px-then-1px offset divider used throughout as a section boundary. */
export function DoubleRule({ className }: { className?: string }) {
  return (
    <div className={cn("", className)}>
      <div className="border-t-2 border-ink" />
      <div className="mt-[3px] border-t border-ink" />
    </div>
  );
}
