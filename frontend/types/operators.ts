/**
 * Operator Types and Interfaces
 * Multi-tenancy organization management
 */

// Operator interface - matches database schema
export interface Operator {
  id: number;
  name: string;
  rut?: string | null; // Format: 21.023.531-0
  super: boolean;
  expiration?: string | null; // Expiration date for the operator
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

// Create operator input - matches database schema
export interface CreateOperatorInput {
  name: string;
  rut?: string; // Format: 21.023.531-0
  super?: boolean;
  expiration?: string; // ISO date string
  status?: boolean;
}

// Update operator input - matches database schema
export interface UpdateOperatorInput {
  name?: string;
  rut?: string;
  super?: boolean;
  expiration?: string;
  status?: boolean;
}

// Operator query parameters
export interface OperatorQueryParams {
  search?: string;
  status?: boolean;
  super?: boolean;
  page?: number;
  limit?: number;
}

// Paginated operators response
export interface PaginatedOperators {
  data: Operator[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Operator statistics
export interface OperatorStatistics {
  totalUsers: number;
  activeUsers: number;
  totalRoles: number;
  totalClients: number;
  totalOperations: number;
}
