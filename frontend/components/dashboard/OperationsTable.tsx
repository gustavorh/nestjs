"use client";

import type { LiveOperation } from "@/types/dashboard";

interface OperationsTableProps {
  operations: LiveOperation[];
  loading?: boolean;
  onOperationClick?: (operation: LiveOperation) => void;
}

const statusConfig: Record<
  string,
  { label: string; className: string; icon: string }
> = {
  scheduled: {
    label: "Programada",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    icon: "📅",
  },
  confirmed: {
    label: "Confirmada",
    className: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    icon: "✓",
  },
  "in-progress": {
    label: "En Tránsito",
    className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    icon: "🚚",
  },
  completed: {
    label: "Completada",
    className: "bg-green-500/10 text-green-500 border-green-500/20",
    icon: "✓✓",
  },
  cancelled: {
    label: "Cancelada",
    className: "bg-red-500/10 text-red-500 border-red-500/20",
    icon: "✕",
  },
  delayed: {
    label: "Retrasada",
    className: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    icon: "⚠",
  },
};

export function OperationsTable({
  operations,
  loading,
  onOperationClick,
}: OperationsTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (operations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <svg
          className="w-16 h-16 mb-4 opacity-50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-lg font-medium">No se encontraron operaciones</p>
        <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4 whitespace-nowrap">
              ID / Fecha
            </th>
            <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4 whitespace-nowrap">
              Cliente
            </th>
            <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4 whitespace-nowrap">
              Ruta
            </th>
            <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4 whitespace-nowrap">
              Tipo
            </th>
            <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4 whitespace-nowrap">
              Vehículo
            </th>
            <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4 whitespace-nowrap">
              Chofer
            </th>
            <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4 whitespace-nowrap">
              Estado
            </th>
            <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4 whitespace-nowrap">
              Progreso
            </th>
            <th className="text-left text-xs font-medium text-muted-foreground pb-3 whitespace-nowrap">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {operations.map((operation) => {
            const status =
              statusConfig[operation.operation.status] ||
              statusConfig.scheduled;
            const hasIncidents =
              operation.incidents && operation.incidents.length > 0;
            const isDelayed =
              operation.delayMinutes && operation.delayMinutes > 0;

            return (
              <tr
                key={operation.operation.id}
                className="border-b border-border hover:bg-ui-surface-elevated transition-colors cursor-pointer"
                onClick={() => onOperationClick?.(operation)}
              >
                {/* ID / Date */}
                <td className="py-4 pr-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {operation.operation.operationNumber}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(
                        operation.operation.scheduledStartDate
                      ).toLocaleDateString("es-CL", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </td>

                {/* Client */}
                <td className="py-4 pr-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-foreground">
                      {operation.client?.businessName || "Sin cliente"}
                    </span>
                    {operation.client?.industry && (
                      <span className="text-xs text-muted-foreground">
                        {operation.client.industry}
                      </span>
                    )}
                  </div>
                </td>

                {/* Route */}
                <td className="py-4 pr-4">
                  <div className="flex flex-col max-w-xs">
                    <span className="text-sm text-foreground truncate">
                      {operation.operation.origin}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 14l-7 7m0 0l-7-7m7 7V3"
                        />
                      </svg>
                      <span className="truncate">
                        {operation.operation.destination}
                      </span>
                    </div>
                    {operation.operation.distance && (
                      <span className="text-xs text-muted-foreground">
                        {operation.operation.distance} km
                      </span>
                    )}
                  </div>
                </td>

                {/* Type */}
                <td className="py-4 pr-4">
                  <span className="text-sm text-foreground capitalize">
                    {operation.operation.operationType.replace(/_/g, " ")}
                  </span>
                </td>

                {/* Vehicle */}
                <td className="py-4 pr-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {operation.vehicle.plateNumber}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {operation.vehicle.brand} {operation.vehicle.model}
                    </span>
                  </div>
                </td>

                {/* Driver */}
                <td className="py-4 pr-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-foreground">
                      {operation.driver.firstName} {operation.driver.lastName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {operation.driver.licenseType}
                    </span>
                  </div>
                </td>

                {/* Status */}
                <td className="py-4 pr-4">
                  <div className="flex flex-col gap-1">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium ${status.className}`}
                    >
                      <span>{status.icon}</span>
                      {status.label}
                    </span>
                    {isDelayed && (
                      <span className="text-xs text-orange-500">
                        +{operation.delayMinutes} min
                      </span>
                    )}
                    {hasIncidents && (
                      <span className="text-xs text-red-500 flex items-center gap-1">
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {operation.incidents?.length || 0} incidente(s)
                      </span>
                    )}
                  </div>
                </td>

                {/* Progress */}
                <td className="py-4 pr-4">
                  {operation.operation.status === "in-progress" &&
                  operation.actualProgress !== undefined ? (
                    <div className="flex flex-col gap-1 min-w-[100px]">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progreso</span>
                        <span className="text-foreground font-medium">
                          {operation.actualProgress}%
                        </span>
                      </div>
                      <div className="w-full bg-ui-surface-elevated rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${operation.actualProgress}%` }}
                        />
                      </div>
                      {operation.estimatedArrival && (
                        <span className="text-xs text-muted-foreground">
                          ETA:{" "}
                          {new Date(
                            operation.estimatedArrival
                          ).toLocaleTimeString("es-CL", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                  ) : operation.operation.status === "completed" ? (
                    <span className="text-sm text-green-500">Completada</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </td>

                {/* Actions */}
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOperationClick?.(operation);
                      }}
                      className="p-1 hover:bg-ui-surface-elevated rounded text-muted-foreground hover:text-foreground"
                      title="Ver detalles"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                    {operation.operation.status === "in-progress" && (
                      <button
                        className="p-1 hover:bg-ui-surface-elevated rounded text-muted-foreground hover:text-foreground"
                        title="Rastrear en tiempo real"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
