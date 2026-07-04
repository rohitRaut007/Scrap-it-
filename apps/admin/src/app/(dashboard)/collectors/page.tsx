"use client";

import { AlertTriangle, Star } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollectors } from "@/hooks/use-collectors";
import { formatRelative } from "@/lib/order-utils";

export default function CollectorsPage() {
  const { data, isLoading, error } = useCollectors();
  const collectors = data?.data ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Collectors</h1>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Collector</TableHead>
              <TableHead className="hidden sm:table-cell">Vehicle</TableHead>
              <TableHead className="hidden sm:table-cell">Rating</TableHead>
              <TableHead className="hidden md:table-cell">Phone</TableHead>
              <TableHead className="hidden lg:table-cell">Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!isLoading && collectors.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  No collectors registered yet.
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              collectors.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-medium text-sm">{c.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{c.email}</div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {c.vehicleInfo ? (
                      <span className="text-sm">{c.vehicleInfo}</span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-sm text-warning">
                        <AlertTriangle size={13} />
                        <em className="not-italic italic text-muted-foreground">Not set</em>
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {c.rating != null ? (
                      <span className="flex items-center gap-1 text-sm">
                        <Star size={12} className="text-signal fill-signal" />
                        {c.rating.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-sm italic text-muted-foreground">No rating</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {c.phone ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {formatRelative(c.createdAt)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {!isLoading && data && (
        <p className="mt-3 text-xs text-muted-foreground">
          {data.total} collector{data.total !== 1 ? "s" : ""} registered
        </p>
      )}
    </div>
  );
}
