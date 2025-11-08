/**
 * Truck Types and Interfaces
 */

// ============================================================================
// ENUMS
// ============================================================================
export enum VehicleType {
  TRUCK = "truck",
  VAN = "van",
  PICKUP = "pickup",
  FLATBED = "flatbed",
  TRAILER = "trailer",
  DUMP_TRUCK = "dump_truck",
  CRANE_TRUCK = "crane_truck",
  OTHER = "other",
}

export enum CapacityUnit {
  KG = "kg",
  TONS = "tons",
  M3 = "m3",
  PASSENGERS = "passengers",
}

export enum OperationalStatus {
  ACTIVE = "active",
  MAINTENANCE = "maintenance",
  OUT_OF_SERVICE = "out_of_service",
  RESERVED = "reserved",
}

export enum DocumentType {
  CIRCULATION_PERMIT = "circulation_permit",
  TECHNICAL_REVIEW = "technical_review",
  INSURANCE = "insurance",
  OWNERSHIP = "ownership",
  GAS_CERTIFICATION = "gas_certification",
  OTHER = "other",
}

// ============================================================================
// CONSTANTS
// ============================================================================
export const VEHICLE_TYPES = [
  { value: VehicleType.TRUCK, label: "Camión" },
  { value: VehicleType.VAN, label: "Furgón" },
  { value: VehicleType.PICKUP, label: "Camioneta" },
  { value: VehicleType.FLATBED, label: "Plataforma" },
  { value: VehicleType.TRAILER, label: "Remolque" },
  { value: VehicleType.DUMP_TRUCK, label: "Tolva" },
  { value: VehicleType.CRANE_TRUCK, label: "Grúa" },
  { value: VehicleType.OTHER, label: "Otro" },
];

export const CAPACITY_UNITS = [
  { value: CapacityUnit.KG, label: "Kilogramos (kg)" },
  { value: CapacityUnit.TONS, label: "Toneladas (ton)" },
  { value: CapacityUnit.M3, label: "Metros Cúbicos (m³)" },
  { value: CapacityUnit.PASSENGERS, label: "Pasajeros" },
];

export const OPERATIONAL_STATUS = [
  { value: OperationalStatus.ACTIVE, label: "Activo", color: "green" },
  {
    value: OperationalStatus.MAINTENANCE,
    label: "En Mantenimiento",
    color: "yellow",
  },
  {
    value: OperationalStatus.OUT_OF_SERVICE,
    label: "Fuera de Servicio",
    color: "red",
  },
  { value: OperationalStatus.RESERVED, label: "Reservado", color: "blue" },
];

export const DOCUMENT_TYPES = [
  { value: DocumentType.CIRCULATION_PERMIT, label: "Permiso de Circulación" },
  { value: DocumentType.TECHNICAL_REVIEW, label: "Revisión Técnica" },
  { value: DocumentType.INSURANCE, label: "Seguro" },
  { value: DocumentType.OWNERSHIP, label: "Certificado de Propiedad" },
  { value: DocumentType.GAS_CERTIFICATION, label: "Certificación de Gas" },
  { value: DocumentType.OTHER, label: "Otro" },
];

// ============================================================================
// INTERFACES
// ============================================================================

export interface TruckDocument {
  id: number;
  vehicleId: number;
  documentType: DocumentType;
  documentName: string;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  issueDate?: string;
  expirationDate?: string;
  insuranceCompany?: string;
  policyNumber?: string;
  coverageAmount?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: number;
  updatedBy?: number;
  isExpired?: boolean;
  daysUntilExpiration?: number;
}

export interface Truck {
  id: number;
  operatorId: number;
  plateNumber: string;
  brand?: string;
  model?: string;
  year?: number;
  vehicleType: VehicleType;
  capacity?: number;
  capacityUnit?: CapacityUnit;
  vin?: string;
  color?: string;
  status: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: number;
  updatedBy?: number;
  documents?: TruckDocument[];
  currentDriver?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  operationalStatus?: OperationalStatus;
  totalOperations?: number;
  upcomingOperations?: number;
  lastOperationDate?: string;
}

export interface CreateTruckInput {
  plateNumber: string;
  brand?: string;
  model?: string;
  year?: number;
  vehicleType: VehicleType;
  capacity?: number;
  capacityUnit?: CapacityUnit;
  vin?: string;
  color?: string;
  status?: boolean;
  notes?: string;
}

export interface UpdateTruckInput {
  plateNumber?: string;
  brand?: string;
  model?: string;
  year?: number;
  vehicleType?: VehicleType;
  capacity?: number;
  capacityUnit?: CapacityUnit;
  vin?: string;
  color?: string;
  status?: boolean;
  notes?: string;
}

export interface TruckQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  vehicleType?: VehicleType;
  status?: boolean;
  operationalStatus?: OperationalStatus;
  includeDocuments?: boolean;
  includeStats?: boolean;
}

export interface PaginatedTrucks {
  data: Truck[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateTruckDocumentInput {
  vehicleId: number;
  documentType: DocumentType;
  documentName: string;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  issueDate?: string;
  expirationDate?: string;
  insuranceCompany?: string;
  policyNumber?: string;
  coverageAmount?: number;
  notes?: string;
}

export interface UpdateTruckDocumentInput {
  documentType?: DocumentType;
  documentName?: string;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  issueDate?: string;
  expirationDate?: string;
  insuranceCompany?: string;
  policyNumber?: string;
  coverageAmount?: number;
  notes?: string;
}

export interface TruckOperation {
  id: number;
  operationNumber: string;
  operationType: string;
  origin: string;
  destination: string;
  scheduledStartDate: string;
  scheduledEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  status: string;
  driver?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export interface TruckStatistics {
  totalOperations: number;
  completedOperations: number;
  upcomingOperations: number;
  totalDistance?: number;
  averageOperationsPerMonth?: number;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
}
