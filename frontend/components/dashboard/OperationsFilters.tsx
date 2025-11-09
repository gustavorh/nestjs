"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  DashboardFilters,
  DashboardFilterOptions,
  TimeRange,
} from "@/types/dashboard";

interface OperationsFiltersProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
  filterOptions: DashboardFilterOptions;
  loading?: boolean;
}

const timeRanges: TimeRange[] = [
  { label: "Hoy", value: "today" },
  { label: "Ayer", value: "yesterday" },
  { label: "Esta Semana", value: "week" },
  { label: "Este Mes", value: "month" },
  { label: "Personalizado", value: "custom" },
];

export function OperationsFilters({
  filters,
  onFiltersChange,
  filterOptions,
  loading = false,
}: OperationsFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] =
    useState<TimeRange["value"]>("today");
  const [showCustomDates, setShowCustomDates] = useState(false);

  const handleFilterChange = (
    key: keyof DashboardFilters,
    value: string | number | null
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value || null,
    });
  };

  const handleTimeRangeChange = (rangeValue: TimeRange["value"]) => {
    setSelectedTimeRange(rangeValue);
    const today = new Date();
    let startDate: Date;
    let endDate: Date = today;

    switch (rangeValue) {
      case "today":
        startDate = new Date(today.setHours(0, 0, 0, 0));
        endDate = new Date(today.setHours(23, 59, 59, 999));
        setShowCustomDates(false);
        break;
      case "yesterday":
        startDate = new Date(today.setDate(today.getDate() - 1));
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        setShowCustomDates(false);
        break;
      case "week":
        startDate = new Date(today.setDate(today.getDate() - 7));
        setShowCustomDates(false);
        break;
      case "month":
        startDate = new Date(today.setMonth(today.getMonth() - 1));
        setShowCustomDates(false);
        break;
      case "custom":
        setShowCustomDates(true);
        return;
    }

    onFiltersChange({
      ...filters,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      clientId: null,
      providerId: null,
      routeId: null,
      driverId: null,
      vehicleId: null,
      status: null,
      operationType: null,
      startDate: null,
      endDate: null,
      search: null,
    });
    setSelectedTimeRange("today");
    setShowCustomDates(false);
  };

  const activeFiltersCount = Object.values(filters).filter(
    (value) => value !== null && value !== undefined && value !== ""
  ).length;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-foreground text-lg flex items-center gap-2">
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
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filtros Avanzados
          {activeFiltersCount > 0 && (
            <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </CardTitle>
        <div className="flex gap-2">
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-muted-foreground hover:text-foreground px-3 py-1 rounded border border-border hover:border-slate-500"
            >
              Limpiar
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-primary hover:text-purple-300 px-3 py-1 rounded border border-primary hover:border-purple-300"
          >
            {isExpanded ? "Contraer" : "Expandir"}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar por número de operación, origen, destino..."
            value={filters.search || ""}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="w-full px-4 py-2 bg-ui-surface-elevated border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Quick Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Estado
            </label>
            <select
              value={filters.status || ""}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full px-3 py-2 bg-ui-surface-elevated border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              disabled={loading}
            >
              <option value="">Todos los estados</option>
              {filterOptions.statuses.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Operation Type Filter */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Tipo de Operación
            </label>
            <select
              value={filters.operationType || ""}
              onChange={(e) =>
                handleFilterChange("operationType", e.target.value)
              }
              className="w-full px-3 py-2 bg-ui-surface-elevated border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              disabled={loading}
            >
              <option value="">Todos los tipos</option>
              {filterOptions.operationTypes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Client Filter */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Cliente
            </label>
            <select
              value={filters.clientId || ""}
              onChange={(e) =>
                handleFilterChange(
                  "clientId",
                  e.target.value ? Number(e.target.value) : null
                )
              }
              className="w-full px-3 py-2 bg-ui-surface-elevated border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              disabled={loading}
            >
              <option value="">Todos los clientes</option>
              {filterOptions.clients.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Time Range Filter */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Período
            </label>
            <select
              value={selectedTimeRange}
              onChange={(e) =>
                handleTimeRangeChange(e.target.value as TimeRange["value"])
              }
              className="w-full px-3 py-2 bg-ui-surface-elevated border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              disabled={loading}
            >
              {timeRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Date Range */}
        {showCustomDates && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Fecha Inicio
              </label>
              <input
                type="datetime-local"
                value={filters.startDate?.substring(0, 16) || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "startDate",
                    e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null
                  )
                }
                className="w-full px-3 py-2 bg-ui-surface-elevated border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Fecha Fin
              </label>
              <input
                type="datetime-local"
                value={filters.endDate?.substring(0, 16) || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "endDate",
                    e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null
                  )
                }
                className="w-full px-3 py-2 bg-ui-surface-elevated border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
          </div>
        )}

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-4 border-t border-border">
            {/* Route Filter */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Tramo/Ruta
              </label>
              <select
                value={filters.routeId || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "routeId",
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                className="w-full px-3 py-2 bg-ui-surface-elevated border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                disabled={loading}
              >
                <option value="">Todos los tramos</option>
                {filterOptions.routes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Driver Filter */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Chofer
              </label>
              <select
                value={filters.driverId || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "driverId",
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                className="w-full px-3 py-2 bg-ui-surface-elevated border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                disabled={loading}
              >
                <option value="">Todos los choferes</option>
                {filterOptions.drivers.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Vehicle Filter */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Vehículo
              </label>
              <select
                value={filters.vehicleId || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "vehicleId",
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                className="w-full px-3 py-2 bg-ui-surface-elevated border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                disabled={loading}
              >
                <option value="">Todos los vehículos</option>
                {filterOptions.vehicles.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Provider Filter */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Proveedor
              </label>
              <select
                value={filters.providerId || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "providerId",
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                className="w-full px-3 py-2 bg-ui-surface-elevated border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                disabled={loading}
              >
                <option value="">Todos los proveedores</option>
                {filterOptions.providers.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
