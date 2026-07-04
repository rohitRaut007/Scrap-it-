import { type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Variant = "default" | "warning" | "attention";

interface StatsCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon: LucideIcon;
  loading?: boolean;
  variant?: Variant;
}

function valueClass(variant: Variant, value: number | string): string {
  const nonZero = value !== 0 && value !== "0";
  if (!nonZero) return "text-muted-foreground";
  if (variant === "warning") return "text-warn";
  if (variant === "attention") return "text-rust-dark";
  return "text-foreground";
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  loading,
  variant = "default",
}: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon size={16} className="text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className={cn("font-mono text-2xl font-semibold", valueClass(variant, value))}>
            {value}
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
