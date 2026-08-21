"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, MoreVertical, Star } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useCollectors,
  updateCollectorStatus,
  type CollectorAdminDto,
  type CollectorStatus,
} from "@/hooks/use-collectors";
import { formatRelative } from "@/lib/order-utils";
import { AddCollectorDialog } from "@/components/collectors/add-collector-dialog";
import { RemoveCollectorDialog } from "@/components/collectors/remove-collector-dialog";

export default function CollectorsPage() {
  const { data, isLoading, error, mutate } = useCollectors();
  const collectors = data?.data ?? [];
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<CollectorAdminDto | null>(
    null,
  );

  const handleToggleStatus = async (
    id: string,
    currentStatus: CollectorStatus,
  ) => {
    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    setPendingId(id);
    try {
      await updateCollectorStatus(id, nextStatus);
      toast.success(
        nextStatus === "suspended" ? "Collector suspended" : "Collector reactivated",
      );
      await mutate();
    } catch {
      toast.error("Couldn't update collector status");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Collectors</h1>
        <Button onClick={() => setAddOpen(true)}>Add Collector</Button>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Collector</TableHead>
              <TableHead className="hidden sm:table-cell">Vehicle</TableHead>
              <TableHead className="hidden sm:table-cell">Rating</TableHead>
              <TableHead className="hidden md:table-cell">Phone</TableHead>
              <TableHead className="hidden lg:table-cell">Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!isLoading && collectors.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
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
                  <TableCell>
                    <Badge
                      variant={
                        c.status === "suspended"
                          ? "destructive"
                          : c.status === "removed"
                            ? "outline"
                            : "secondary"
                      }
                    >
                      {c.status === "suspended"
                        ? "Suspended"
                        : c.status === "removed"
                          ? "Removed"
                          : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {c.status !== "removed" && (
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant={c.status === "suspended" ? "outline" : "destructive"}
                          disabled={pendingId === c.id}
                          onClick={() => handleToggleStatus(c.id, c.status)}
                        >
                          {c.status === "suspended" ? "Reactivate" : "Suspend"}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="icon-sm"
                              variant="outline"
                              disabled={pendingId === c.id}
                              aria-label="More actions"
                            >
                              <MoreVertical size={14} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() => setRemoveTarget(c)}
                            >
                              Remove…
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
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

      <AddCollectorDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSuccess={() => mutate()}
      />
      <RemoveCollectorDialog
        collector={removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        onSuccess={() => {
          setRemoveTarget(null);
          mutate();
        }}
      />
    </div>
  );
}
