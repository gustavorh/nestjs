"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PerformanceMetrics, DashboardStats } from "@/types/dashboard";

interface PerformanceMetricsPanelProps {
  metrics: PerformanceMetrics;
  stats: DashboardStats;
  loading?: boolean;
}

export function PerformanceMetricsPanel({
  metrics,
  stats,
  loading,
}: PerformanceMetricsPanelProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="bg-card border-border animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-ui-surface-elevated rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Operations */}
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Operaciones Totales
                </p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {metrics.totalOperations}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.operationsInTransit} en tránsito
                </p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <svg
                  className="w-8 h-8 text-blue-500"
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Compliance */}
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Cumplimiento
                </p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {metrics.scheduleComplianceRate.toFixed(1)}%
                </p>
                <p className="text-xs text-green-500 mt-1">
                  {metrics.onTimeDeliveries} entregas a tiempo
                </p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg">
                <svg
                  className="w-8 h-8 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average Travel Time */}
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Tiempo Promedio
                </p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {(metrics.averageTravelTime / 60).toFixed(1)}h
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.averageDistance.toFixed(0)} km promedio
                </p>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <svg
                  className="w-8 h-8 text-purple-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Incidents */}
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Incidentes
                </p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {metrics.totalIncidents}
                </p>
                <p className="text-xs text-red-500 mt-1">
                  {metrics.criticalIncidents} críticos
                </p>
              </div>
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <svg
                  className="w-8 h-8 text-orange-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown & Efficiency Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              Distribución de Estados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-foreground">Programadas</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-ui-surface-elevated rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${
                          (stats.statusBreakdown.scheduled /
                            metrics.totalOperations) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground w-12 text-right">
                    {stats.statusBreakdown.scheduled}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                  <span className="text-sm text-foreground">Confirmadas</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-ui-surface-elevated rounded-full h-2">
                    <div
                      className="bg-cyan-500 h-2 rounded-full"
                      style={{
                        width: `${
                          (stats.statusBreakdown.confirmed /
                            metrics.totalOperations) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground w-12 text-right">
                    {stats.statusBreakdown.confirmed}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm text-foreground">En Progreso</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-ui-surface-elevated rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{
                        width: `${
                          (stats.statusBreakdown.inProgress /
                            metrics.totalOperations) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground w-12 text-right">
                    {stats.statusBreakdown.inProgress}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm text-foreground">Completadas</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-ui-surface-elevated rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${
                          (stats.statusBreakdown.completed /
                            metrics.totalOperations) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground w-12 text-right">
                    {stats.statusBreakdown.completed}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-sm text-foreground">Retrasadas</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-ui-surface-elevated rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full"
                      style={{
                        width: `${
                          (stats.statusBreakdown.delayed /
                            metrics.totalOperations) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground w-12 text-right">
                    {stats.statusBreakdown.delayed}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm text-foreground">Canceladas</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-ui-surface-elevated rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{
                        width: `${
                          (stats.statusBreakdown.cancelled /
                            metrics.totalOperations) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground w-12 text-right">
                    {stats.statusBreakdown.cancelled}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Incident Breakdown */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              Análisis de Incidentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(metrics.incidentsByType).length > 0 ? (
                Object.entries(metrics.incidentsByType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm text-foreground capitalize">
                      {type.replace(/_/g, " ")}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-ui-surface-elevated rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full"
                          style={{
                            width: `${(count / metrics.totalIncidents) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-foreground w-12 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <svg
                    className="w-12 h-12 mb-2 opacity-50"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm">No hay incidentes registrados</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Efficiency Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Distancia Total
                </p>
                <p className="text-2xl font-bold text-foreground mt-2">
                  {metrics.totalDistance.toLocaleString()} km
                </p>
              </div>
              <svg
                className="w-10 h-10 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Tasa de Utilización
                </p>
                <p className="text-2xl font-bold text-foreground mt-2">
                  {metrics.utilizationRate.toFixed(1)}%
                </p>
              </div>
              <svg
                className="w-10 h-10 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Operaciones Activas
                </p>
                <p className="text-2xl font-bold text-foreground mt-2">
                  {stats.totalActiveOperations}
                </p>
              </div>
              <svg
                className="w-10 h-10 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
