"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_DISPLAY_ORDER, orderStatusLabel } from "@/lib/order-utils";

export function OrdersFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.delete("page"); // reset pagination on filter change
    router.push(`/orders?${next.toString()}`);
  };

  const currentStatus = params.get("status") ?? "all";

  return (
    <Select
      value={currentStatus}
      onValueChange={(v) => updateParam("status", v === "all" ? "" : v)}
    >
      <SelectTrigger className="w-44">
        <SelectValue placeholder="All statuses" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All statuses</SelectItem>
        {STATUS_DISPLAY_ORDER.map((s) => (
          <SelectItem key={s} value={s}>
            {orderStatusLabel(s)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
