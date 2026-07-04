"use client";

import { AlertTriangle, CheckCircle2, Clock, Plus, Truck } from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { useStats } from "@/hooks/use-stats";
import { useAtRiskOrders } from "@/hooks/use-at-risk-orders";

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useStats();
  const { atRiskCount, isLoading: atRiskLoading } = useAtRiskOrders();

  const happeningNow =
    (stats?.byStatus?.en_route ?? 0) + (stats?.byStatus?.arriving ?? 0);
  const queue =
    (stats?.byStatus?.scheduled ?? 0) + (stats?.byStatus?.assigned ?? 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          title="Needs Attention"
          value={atRiskCount}
          icon={AlertTriangle}
          loading={atRiskLoading}
          description="Overdue unassigned orders"
          variant="warning"
        />
        <StatsCard
          title="Happening Now"
          value={happeningNow}
          icon={Truck}
          loading={statsLoading}
          description="En route + Arriving"
          variant="attention"
        />
        <StatsCard
          title="Queue"
          value={queue}
          icon={Clock}
          loading={statsLoading}
          description="Scheduled + Assigned"
        />
        <StatsCard
          title="New Today"
          value={stats?.todayNewOrders ?? 0}
          icon={Plus}
          loading={statsLoading}
          description="Orders placed today"
        />
      </div>

      <p className="mt-5 text-xs text-muted-foreground">
        {!statsLoading && stats && (
          <>
            {stats.byStatus?.completed ?? 0} completed all-time
            {" · "}
            {stats.totalCollectors ?? 0} collectors registered
          </>
        )}
      </p>
    </div>
  );
}
