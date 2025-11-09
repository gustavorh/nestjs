/**
 * Dashboard Types for Operations Overview Module
 */

import type { OperationWithDetails } from "./operations";

// ============================================================================
// DASHBOARD FILTERS
// ============================================================================

export interface DashboardFilters {
  clientId?: number | null;
  providerId?: number | null;
  routeId?: number | null;
  driverId?: number | null;
  vehicleId?: number | null;
  status?: string | null;
  operationType?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  search?: string | null;
}

// ============================================================================
// REAL-TIME OPERATION DATA
// ============================================================================

export interface LiveOperation extends OperationWithDetails {
  // Real-time fields
  currentStatus:
    | "pending"
    | "in-transit"
    | "delayed"
    | "completed"
    | "incident";
  estimatedArrival?: string | null;
  actualProgress?: number; // 0-100 percentage
  delayMinutes?: number;
  lastUpdate: string;
  incidents?: OperationIncident[];
}

// ============================================================================
// INCIDENTS & EVENTS
// ============================================================================

export interface OperationIncident {
  id: number;
  operationId: number;
  incidentType:
    | "delay"
    | "breakdown"
    | "accident"
    | "weather"
    | "road_closure"
    | "other";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  reportedAt: string;
  reportedBy?: string;
  resolvedAt?: string | null;
  resolution?: string | null;
  location?: string;
  impact?: string;
}

// ============================================================================
// PERFORMANCE INDICATORS (KPIs)
// ============================================================================

export interface PerformanceMetrics {
  // Travel time metrics
  averageTravelTime: number; // minutes
  totalOperations: number;
  completedOperations: number;
  activeOperations: number;

  // Schedule compliance
  onTimeDeliveries: number;
  delayedOperations: number;
  scheduleComplianceRate: number; // percentage

  // Incidents
  totalIncidents: number;
  incidentsByType: Record<string, number>;
  incidentsBySeverity: Record<string, number>;
  criticalIncidents: number;

  // Efficiency
  totalDistance: number; // km
  averageDistance: number; // km
  utilizationRate: number; // percentage of vehicles in use

  // Time periods
  todayOperations: number;
  weekOperations: number;
  monthOperations: number;
}

// ============================================================================
// DASHBOARD STATISTICS
// ============================================================================

export interface DashboardStats {
  totalActiveOperations: number;
  operationsInTransit: number;
  operationsPending: number;
  operationsCompleted: number;
  operationsDelayed: number;
  operationsWithIncidents: number;

  // Status breakdown
  statusBreakdown: {
    scheduled: number;
    confirmed: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    delayed: number;
  };

  // Recent trends
  todayCompletion: number;
  weekCompletion: number;
  averageCompletionTime: number; // hours

  // Alerts
  activeAlerts: number;
  criticalAlerts: number;
}

// ============================================================================
// ALERT TYPES
// ============================================================================

export interface DashboardAlert {
  id: number;
  operationId: number;
  operationNumber: string;
  alertType:
    | "delay"
    | "incident"
    | "document_expiry"
    | "maintenance"
    | "route_issue";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: number | null;
  acknowledgedAt?: string | null;
}

// ============================================================================
// FILTER OPTIONS
// ============================================================================

export interface FilterOption {
  value: string | number;
  label: string;
}

export interface DashboardFilterOptions {
  clients: FilterOption[];
  providers: FilterOption[];
  routes: FilterOption[];
  drivers: FilterOption[];
  vehicles: FilterOption[];
  statuses: FilterOption[];
  operationTypes: FilterOption[];
}

// ============================================================================
// TIME RANGE
// ============================================================================

export interface TimeRange {
  label: string;
  value: "today" | "yesterday" | "week" | "month" | "custom";
  startDate?: string;
  endDate?: string;
}

// ============================================================================
// EXPORT OPTIONS
// ============================================================================

export interface ExportOptions {
  format: "csv" | "excel" | "pdf";
  includeFilters: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  fields?: string[];
}
