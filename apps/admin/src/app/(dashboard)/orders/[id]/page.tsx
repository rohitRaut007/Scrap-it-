"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, MapPin, Tag, Camera, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/orders/status-badge";
import { AssignCollectorDialog } from "@/components/orders/assign-collector-dialog";
import { UpdateStatusDialog } from "@/components/orders/update-status-dialog";
import { OrderStatusProgress } from "@/components/orders/order-status-progress";
import { useOrder } from "@/hooks/use-orders";
import { validNextStatuses, type OrderStatus } from "@/lib/order-utils";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: order, isLoading, error, mutate } = useOrder(id);

  const [assignOpen, setAssignOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !order) {
    const is404 = error && "status" in error && (error as { status: number }).status === 404;
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <p className="text-lg font-medium">
          {is404 ? "Order not found" : "Could not load order"}
        </p>
        <p className="text-muted-foreground mt-1">
          {is404
            ? "This order may have been deleted or the ID is incorrect."
            : (error?.message ?? "An unexpected error occurred.")}
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/orders")}
        >
          Back to orders
        </Button>
      </div>
    );
  }

  const nextStatuses = validNextStatuses(order.status as OrderStatus);
  const canAssign =
    order.status === "scheduled" || order.status === "assigned";
  const canUpdateStatus =
    nextStatuses.length > 0 && order.status !== "scheduled";

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Heading */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => router.push("/orders")}
        >
          <ArrowLeft size={16} className="mr-1" />
          Orders
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono text-muted-foreground">
            {order.id}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={order.status} />
            <span className="text-sm text-muted-foreground">
              Created {formatDate(order.createdAt)}
            </span>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex gap-2 shrink-0">
          {canAssign && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAssignOpen(true)}
            >
              {order.collectorInfo ? "Reassign collector" : "Assign collector"}
            </Button>
          )}
          {canUpdateStatus && (
            <Button size="sm" onClick={() => setStatusOpen(true)}>
              Update status
            </Button>
          )}
        </div>
      </div>

      {/* Status progress stepper */}
      <Card>
        <CardContent className="pt-4 pb-2">
          <OrderStatusProgress status={order.status} timeline={order.timeline} />
        </CardContent>
      </Card>

      {/* Customer */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <User size={14} />
            Customer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="font-medium">{order.customerName ?? "—"}</p>
          <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
          {order.customerPhone && (
            <p className="text-sm text-muted-foreground">
              {order.customerPhone}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Address + Schedule */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin size={14} />
              Pickup address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{order.addressLine}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock size={14} />
              Scheduled for
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{formatDate(order.scheduledAt)}</p>
            {order.totalWeightKg != null && (
              <p className="text-sm text-muted-foreground mt-1">
                Weight: {order.totalWeightKg} kg
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Collector */}
      {order.collectorInfo && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Assigned collector
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="font-medium">
              {order.collectorInfo.name ?? "Unnamed"}
            </p>
            {order.collectorInfo.phone && (
              <p className="text-sm text-muted-foreground">
                {order.collectorInfo.phone}
              </p>
            )}
            {order.collectorInfo.vehicleInfo && (
              <p className="text-sm text-muted-foreground">
                {order.collectorInfo.vehicleInfo}
              </p>
            )}
            {order.collectorInfo.rating != null && (
              <p className="text-sm text-muted-foreground">
                ★ {order.collectorInfo.rating.toFixed(1)}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Categories — always rendered */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Tag size={14} />
            Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          {order.categoryNames.length === 0 ? (
            <p className="text-sm italic text-muted-foreground">
              No categories specified.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {order.categoryNames.map((name) => (
                <span
                  key={name}
                  className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full"
                >
                  {name}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {order.notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{order.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Photos */}
      {order.photoUrls.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Camera size={14} />
              Photos ({order.photoUrls.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {order.photoUrls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Pickup photo ${i + 1}`}
                  className="w-full aspect-square object-cover rounded-lg bg-muted"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {order.timeline.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {order.timeline.map((entry, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div>
                    <span className="font-medium capitalize">
                      {entry.eventType.replace(/_/g, " ")}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      {formatDate(entry.occurredAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <AssignCollectorDialog
        orderId={order.id}
        currentCollectorId={order.collectorInfo?.id}
        open={assignOpen}
        onOpenChange={setAssignOpen}
        onSuccess={() => void mutate()}
      />
      <UpdateStatusDialog
        orderId={order.id}
        currentStatus={order.status}
        open={statusOpen}
        onOpenChange={setStatusOpen}
        onSuccess={() => void mutate()}
      />
    </div>
  );
}
