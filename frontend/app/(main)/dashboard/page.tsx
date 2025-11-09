"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUser, isAuthenticated, getToken } from "@/lib/auth";
import { OperationsFilters } from "@/components/dashboard/OperationsFilters";
import { OperationsTable } from "@/components/dashboard/OperationsTable";
import { PerformanceMetricsPanel } from "@/components/dashboard/PerformanceMetricsPanel";
import {
  getOperations,
  getClients,
  getProviders,
  getRoutes,
  getDrivers,
  getVehicles,
} from "@/lib/api";
import type {
  DashboardFilters,
  DashboardFilterOptions,
  LiveOperation,
  PerformanceMetrics,
  DashboardStats,
} from "@/types/dashboard";
import type { OperationWithDetails } from "@/types/operations";

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [operations, setOperations] = useState<LiveOperation[]>([]);
  const [filters, setFilters] = useState<DashboardFilters>({
    search: null,
    status: null,
    operationType: null,
    clientId: null,
    providerId: null,
    routeId: null,
    driverId: null,
    vehicleId: null,
    startDate: null,
    endDate: null,
  });
  const [filterOptions, setFilterOptions] = useState<DashboardFilterOptions>({
    clients: [],
    providers: [],
    routes: [],
    drivers: [],
    vehicles: [],
    statuses: [
      { value: "scheduled", label: "Programada" },
      { value: "confirmed", label: "Confirmada" },
      { value: "in-progress", label: "En Progreso" },
      { value: "completed", label: "Completada" },
      { value: "cancelled", label: "Cancelada" },
      { value: "delayed", label: "Retrasada" },
    ],
    operationTypes: [
      { value: "delivery", label: "Entrega" },
      { value: "pickup", label: "Retiro" },
      { value: "transfer", label: "Traslado" },
      { value: "transport", label: "Transporte" },
      { value: "service", label: "Servicio" },
    ],
  });
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    averageTravelTime: 0,
    totalOperations: 0,
    completedOperations: 0,
    activeOperations: 0,
    onTimeDeliveries: 0,
    delayedOperations: 0,
    scheduleComplianceRate: 0,
    totalIncidents: 0,
    incidentsByType: {},
    incidentsBySeverity: {},
    criticalIncidents: 0,
    totalDistance: 0,
    averageDistance: 0,
    utilizationRate: 0,
    todayOperations: 0,
    weekOperations: 0,
    monthOperations: 0,
  });
  const [stats, setStats] = useState<DashboardStats>({
    totalActiveOperations: 0,
    operationsInTransit: 0,
    operationsPending: 0,
    operationsCompleted: 0,
    operationsDelayed: 0,
    operationsWithIncidents: 0,
    statusBreakdown: {
      scheduled: 0,
      confirmed: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
      delayed: 0,
    },
    todayCompletion: 0,
    weekCompletion: 0,
    averageCompletionTime: 0,
    activeAlerts: 0,
    criticalAlerts: 0,
  });

  useEffect(() => {
    // This runs only on the client after mount
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    // This is the standard pattern for preventing hydration issues in Next.js
    // See: https://nextjs.org/docs/messages/react-hydration-error
    setMounted(true);
  }, [router]);

  const user = getUser();
  const token = getToken();

  // Load filter options
  useEffect(() => {
    if (!mounted || !token || !user) return;

    let isMounted = true;

    const loadFilterOptions = async () => {
      try {
        const [clientsRes, providersRes, routesRes, driversRes, vehiclesRes] =
          await Promise.all([
            getClients(token, {
              operatorId: user.operatorId,
              status: true,
              limit: 1000,
            }),
            getProviders(token, {
              operatorId: user.operatorId,
              status: true,
              limit: 1000,
            }),
            getRoutes(token, { status: true, limit: 1000 }),
            getDrivers(token, {
              operatorId: user.operatorId,
              status: true,
              limit: 1000,
            }),
            getVehicles(token, {
              status: true,
              limit: 1000,
            }),
          ]);

        if (!isMounted) return;

        setFilterOptions((prev) => ({
          ...prev,
          clients: clientsRes.data.map((c) => ({
            value: c.id,
            label: c.businessName,
          })),
          providers: providersRes.data.map((p) => ({
            value: p.id,
            label: p.businessName,
          })),
          routes: routesRes.data.map((r) => ({ value: r.id, label: r.name })),
          drivers: driversRes.data.map((d) => ({
            value: d.id,
            label: `${d.firstName} ${d.lastName}`,
          })),
          vehicles: vehiclesRes.data.map((v) => ({
            value: v.id,
            label: v.plateNumber,
          })),
        }));
      } catch (error) {
        console.error("Error loading filter options:", error);
      }
    };

    loadFilterOptions();

    return () => {
      isMounted = false;
    };
  }, [mounted, token, user]);

  // Load operations data
  useEffect(() => {
    if (!mounted || !token || !user) return;

    let isMounted = true;

    const loadOperations = async () => {
      setLoading(true);
      try {
        const params: Record<string, unknown> = {
          operatorId: user.operatorId,
          page: 1,
          limit: 100,
        };

        // Apply filters
        if (filters.clientId) params.clientId = filters.clientId;
        if (filters.providerId) params.providerId = filters.providerId;
        if (filters.routeId) params.routeId = filters.routeId;
        if (filters.driverId) params.driverId = filters.driverId;
        if (filters.vehicleId) params.vehicleId = filters.vehicleId;
        if (filters.status) params.status = filters.status;
        if (filters.operationType) params.operationType = filters.operationType;
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;

        const response = await getOperations(token, params as never);

        if (!isMounted) return;

        // Convert to LiveOperation format
        const liveOps: LiveOperation[] = response.data.map(
          (op: OperationWithDetails) => ({
            ...op,
            currentStatus:
              op.operation.status === "in-progress"
                ? "in-transit"
                : op.operation.status === "scheduled"
                ? "pending"
                : "completed",
            lastUpdate: new Date().toISOString(),
            actualProgress:
              op.operation.status === "in-progress"
                ? Math.floor(Math.random() * 100)
                : undefined,
            estimatedArrival:
              op.operation.status === "in-progress"
                ? new Date(Date.now() + Math.random() * 3600000).toISOString()
                : null,
            delayMinutes:
              Math.random() > 0.8 ? Math.floor(Math.random() * 60) : 0,
            incidents: [],
          })
        );

        setOperations(liveOps);

        // Calculate metrics and stats
        calculateMetrics(liveOps);
        calculateStats(liveOps);
      } catch (error) {
        console.error("Error loading operations:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadOperations();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    mounted,
    token,
    user?.operatorId,
    filters.clientId,
    filters.providerId,
    filters.routeId,
    filters.driverId,
    filters.vehicleId,
    filters.status,
    filters.operationType,
    filters.startDate,
    filters.endDate,
  ]);

  const calculateMetrics = useCallback((ops: LiveOperation[]) => {
    const total = ops.length;
    const completed = ops.filter(
      (o) => o.operation.status === "completed"
    ).length;
    const active = ops.filter(
      (o) => o.operation.status === "in-progress"
    ).length;
    const delayed = ops.filter((o) => (o.delayMinutes || 0) > 0).length;
    const onTime = completed - delayed;
    const totalDist = ops.reduce(
      (sum, o) => sum + (o.operation.distance || 0),
      0
    );

    setMetrics({
      averageTravelTime: 240, // Mock: 4 hours
      totalOperations: total,
      completedOperations: completed,
      activeOperations: active,
      onTimeDeliveries: onTime,
      delayedOperations: delayed,
      scheduleComplianceRate: total > 0 ? (onTime / total) * 100 : 0,
      totalIncidents: 0,
      incidentsByType: {},
      incidentsBySeverity: {},
      criticalIncidents: 0,
      totalDistance: totalDist,
      averageDistance: total > 0 ? totalDist / total : 0,
      utilizationRate: 75, // Mock
      todayOperations: ops.filter(
        (o) =>
          new Date(o.operation.scheduledStartDate).toDateString() ===
          new Date().toDateString()
      ).length,
      weekOperations: total,
      monthOperations: total,
    });
  }, []);

  const calculateStats = useCallback((ops: LiveOperation[]) => {
    const statusCounts = {
      scheduled: ops.filter((o) => o.operation.status === "scheduled").length,
      confirmed: ops.filter((o) => o.operation.status === "confirmed").length,
      inProgress: ops.filter((o) => o.operation.status === "in-progress")
        .length,
      completed: ops.filter((o) => o.operation.status === "completed").length,
      cancelled: ops.filter((o) => o.operation.status === "cancelled").length,
      delayed: ops.filter((o) => (o.delayMinutes || 0) > 0).length,
    };

    setStats({
      totalActiveOperations:
        statusCounts.scheduled +
        statusCounts.confirmed +
        statusCounts.inProgress,
      operationsInTransit: statusCounts.inProgress,
      operationsPending: statusCounts.scheduled,
      operationsCompleted: statusCounts.completed,
      operationsDelayed: statusCounts.delayed,
      operationsWithIncidents: 0,
      statusBreakdown: statusCounts,
      todayCompletion: 0,
      weekCompletion: 0,
      averageCompletionTime: 4,
      activeAlerts: 0,
      criticalAlerts: 0,
    });
  }, []);

  const handleOperationClick = useCallback((operation: LiveOperation) => {
    console.log("Operation clicked:", operation);
    // TODO: Navigate to operation detail page
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ui-surface-elevated">
        <p className="text-foreground">Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Vista General de Operaciones
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitoreo en tiempo real de todas las operaciones de traslado
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </div>
            <span className="text-sm text-muted-foreground">
              Actualización en tiempo real
            </span>
          </div>
        </div>

        {/* Performance Metrics */}
        <PerformanceMetricsPanel
          metrics={metrics}
          stats={stats}
          loading={loading}
        />

        {/* Filters */}
        <OperationsFilters
          filters={filters}
          onFiltersChange={setFilters}
          filterOptions={filterOptions}
          loading={loading}
        />

        {/* Operations Table */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-foreground flex items-center gap-2">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              Operaciones Activas
              <span className="text-sm font-normal text-muted-foreground">
                ({operations.length} total)
              </span>
            </CardTitle>
            <div className="flex gap-2">
              <button className="text-sm text-muted-foreground hover:text-foreground px-3 py-1 rounded border border-border hover:border-slate-500 transition-colors">
                <svg
                  className="w-4 h-4 inline-block mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Exportar
              </button>
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-primary hover:text-purple-300 px-3 py-1 rounded border border-primary hover:border-purple-300 transition-colors"
              >
                <svg
                  className="w-4 h-4 inline-block mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Actualizar
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <OperationsTable
              operations={operations}
              loading={loading}
              onOperationClick={handleOperationClick}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
