"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, isAuthenticated, getUser } from "@/lib/auth";
import {
  getOperations,
  deleteOperation,
  createOperation,
  updateOperation,
  getClients,
  getProviders,
  getDrivers,
  getVehicles,
  getRoutes,
} from "@/lib/api";
import type {
  OperationWithDetails,
  OperationQueryParams,
  CreateOperationInput,
  UpdateOperationInput,
} from "@/types/operations";
import type { Client } from "@/types/clients";
import type { Provider } from "@/types/providers";
import type { Driver } from "@/types/drivers";
import type { Vehicle } from "@/types/drivers";
import type { Route } from "@/types/routes";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  Filter,
  Download,
  TrendingUp,
  Calendar,
  Truck,
  MapPin,
  Clock,
  Users,
  Package,
  CheckCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  OPERATION_TYPES as OperationTypes,
  OPERATION_STATUS as OperationStatuses,
} from "@/types/operations";

export default function OperationsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [operations, setOperations] = useState<OperationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [operationToDelete, setOperationToDelete] =
    useState<OperationWithDetails | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [operationToEdit, setOperationToEdit] =
    useState<OperationWithDetails | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  // Form data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [formData, setFormData] = useState<Record<string, any>>({
    operationType: "delivery",
    origin: "",
    destination: "",
    scheduledStartDate: "",
    scheduledEndDate: "",
    cargoDescription: "",
    notes: "",
  });

  // Catalogs for dropdowns
  const [clients, setClients] = useState<Client[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [dateRangeFilter, setDateRangeFilter] = useState<{
    start: string;
    end: string;
  }>({ start: "", end: "" });

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    setMounted(true);
    fetchCatalogs();
    fetchOperations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, typeFilter, clientFilter, providerFilter]);

  const fetchCatalogs = async () => {
    try {
      const token = getToken();
      const user = getUser();
      if (!token || !user) return;

      const [clientsRes, providersRes, driversRes, vehiclesRes, routesRes] =
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
          getDrivers(token, {
            operatorId: user.operatorId,
            status: true,
            limit: 1000,
          }),
          getVehicles(token, {
            status: true,
            limit: 1000,
          }),
          getRoutes(token, { status: true, limit: 1000 }),
        ]);

      setClients(clientsRes.data);
      setProviders(providersRes.data);
      setDrivers(driversRes.data);
      setVehicles(vehiclesRes.data);
      setRoutes(routesRes.data);
    } catch (err) {
      console.error("Error loading catalogs:", err);
    }
  };

  const fetchOperations = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      const user = getUser();
      if (!token || !user) {
        router.push("/login");
        return;
      }

      const params: OperationQueryParams = {
        operatorId: user.operatorId,
        page,
        limit,
      };

      if (search) params.search = search;
      if (statusFilter !== "all") params.status = statusFilter;
      if (typeFilter !== "all") params.operationType = typeFilter;
      if (clientFilter !== "all") params.clientId = parseInt(clientFilter);
      if (providerFilter !== "all")
        params.providerId = parseInt(providerFilter);
      if (dateRangeFilter.start) params.startDate = dateRangeFilter.start;
      if (dateRangeFilter.end) params.endDate = dateRangeFilter.end;

      const response = await getOperations(token, params);
      setOperations(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar operaciones"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchOperations();
  };

  const handleDeleteClick = (operation: OperationWithDetails) => {
    setOperationToDelete(operation);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!operationToDelete) return;

    try {
      const token = getToken();
      if (!token) return;

      await deleteOperation(token, operationToDelete.operation.id);
      setDeleteDialogOpen(false);
      setOperationToDelete(null);
      fetchOperations();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al eliminar operación"
      );
    }
  };

  const handleCreateClick = () => {
    const user = getUser();
    if (!user) return;

    // Generate operation number
    const operationNumber = `OP-${Date.now()}`;

    setError(null); // Clear any previous errors
    setFormData({
      operatorId: user.operatorId,
      operationNumber,
      operationType: "delivery",
      origin: "",
      destination: "",
      scheduledStartDate: "",
      scheduledEndDate: "",
      cargoDescription: "",
      notes: "",
    });
    setCreateDialogOpen(true);
  };

  const handleEditClick = (operation: OperationWithDetails) => {
    setError(null); // Clear any previous errors
    setOperationToEdit(operation);

    // Format dates for datetime-local input (YYYY-MM-DDTHH:mm)
    const formatDateTimeLocal = (dateString?: string | null) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setFormData({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      operationType: operation.operation.operationType as any,
      origin: operation.operation.origin,
      destination: operation.operation.destination,
      clientId: operation.operation.clientId || undefined,
      providerId: operation.operation.providerId || undefined,
      routeId: operation.operation.routeId || undefined,
      driverId: operation.operation.driverId,
      vehicleId: operation.operation.vehicleId,
      scheduledStartDate: formatDateTimeLocal(
        operation.operation.scheduledStartDate
      ),
      scheduledEndDate: formatDateTimeLocal(
        operation.operation.scheduledEndDate
      ),
      distance: operation.operation.distance || undefined,
      cargoDescription: operation.operation.cargoDescription || "",
      cargoWeight: operation.operation.cargoWeight || undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      status: operation.operation.status as any,
      notes: operation.operation.notes || "",
    });
    setEditDialogOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    const user = getUser();
    if (!token || !user) return;

    try {
      setFormLoading(true);
      setError(null);

      if (editDialogOpen && operationToEdit) {
        // Update existing operation
        // Convert string IDs to numbers
        const updateData: UpdateOperationInput = {
          operationType: formData.operationType,
          origin: formData.origin,
          destination: formData.destination,
          clientId: formData.clientId ? Number(formData.clientId) : undefined,
          providerId: formData.providerId
            ? Number(formData.providerId)
            : undefined,
          routeId: formData.routeId ? Number(formData.routeId) : undefined,
          driverId: formData.driverId ? Number(formData.driverId) : undefined,
          vehicleId: formData.vehicleId
            ? Number(formData.vehicleId)
            : undefined,
          scheduledStartDate: formData.scheduledStartDate,
          scheduledEndDate: formData.scheduledEndDate || undefined,
          distance: formData.distance ? Number(formData.distance) : undefined,
          status: formData.status,
          cargoDescription: formData.cargoDescription || undefined,
          cargoWeight: formData.cargoWeight
            ? Number(formData.cargoWeight)
            : undefined,
          notes: formData.notes || undefined,
        };
        await updateOperation(token, operationToEdit.operation.id, updateData);
        setEditDialogOpen(false);
        setOperationToEdit(null);
      } else {
        // Create new operation
        // Validate required fields
        if (!formData.driverId || !formData.vehicleId) {
          setError("Chofer y vehículo son obligatorios");
          return;
        }

        // Convert string IDs to numbers and ensure correct types
        const createData: CreateOperationInput = {
          operatorId: user.operatorId,
          operationNumber: formData.operationNumber,
          operationType: formData.operationType,
          origin: formData.origin,
          destination: formData.destination,
          scheduledStartDate: formData.scheduledStartDate,
          scheduledEndDate: formData.scheduledEndDate || undefined,
          driverId: Number(formData.driverId),
          vehicleId: Number(formData.vehicleId),
          clientId: formData.clientId ? Number(formData.clientId) : undefined,
          providerId: formData.providerId
            ? Number(formData.providerId)
            : undefined,
          routeId: formData.routeId ? Number(formData.routeId) : undefined,
          distance: formData.distance ? Number(formData.distance) : undefined,
          cargoDescription: formData.cargoDescription || undefined,
          cargoWeight: formData.cargoWeight
            ? Number(formData.cargoWeight)
            : undefined,
          notes: formData.notes || undefined,
        };
        await createOperation(token, createData);
        setCreateDialogOpen(false);
      }

      fetchOperations();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al guardar operación"
      );
    } finally {
      setFormLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = OperationStatuses.find((s) => s.value === status);
    const colorMap: Record<string, string> = {
      blue: "bg-blue-500/10 text-blue-400 border-blue-500/50",
      cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/50",
      yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/50",
      green: "bg-green-500/10 text-green-400 border-green-500/50",
      red: "bg-red-500/10 text-red-400 border-red-500/50",
      orange: "bg-orange-500/10 text-orange-400 border-orange-500/50",
    };

    return (
      <Badge
        variant="outline"
        className={statusConfig ? colorMap[statusConfig.color] : ""}
      >
        {statusConfig?.label || status}
      </Badge>
    );
  };

  const getOperationTypeLabel = (type: string) => {
    const typeConfig = OperationTypes.find((t) => t.value === type);
    return typeConfig?.label || type;
  };

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-CL", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(date);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#2a2d3a]">
        <p className="text-slate-300">Cargando...</p>
      </div>
    );
  }

  const user = getUser();
  if (!user) {
    return null;
  }

  // Calculate statistics
  const totalScheduled = operations.filter(
    (o) => o.operation.status === "scheduled"
  ).length;
  const totalInProgress = operations.filter(
    (o) => o.operation.status === "in-progress"
  ).length;
  const totalCompleted = operations.filter(
    (o) => o.operation.status === "completed"
  ).length;

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Page Header with Stats */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-purple-400" />
              Programación de Operaciones
            </h1>
            <p className="text-slate-400 mt-1">
              Coordinación y gestión de traslados y operaciones logísticas
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                setViewMode(viewMode === "list" ? "calendar" : "list")
              }
              className="border-slate-600 text-slate-300 hover:bg-[#2a2d3a]"
            >
              {viewMode === "list" ? (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Vista Calendario
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Vista Lista
                </>
              )}
            </Button>
            <Button
              onClick={handleCreateClick}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nueva Operación
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-[#23262f] border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">
                    Total Operaciones
                  </p>
                  <p className="text-2xl font-bold text-slate-100 mt-1">
                    {total}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#23262f] border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">
                    Programadas
                  </p>
                  <p className="text-2xl font-bold text-slate-100 mt-1">
                    {totalScheduled}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#23262f] border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">
                    En Progreso
                  </p>
                  <p className="text-2xl font-bold text-slate-100 mt-1">
                    {totalInProgress}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                  <Truck className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#23262f] border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">
                    Completadas
                  </p>
                  <p className="text-2xl font-bold text-slate-100 mt-1">
                    {totalCompleted}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Card */}
        <Card className="bg-[#23262f] border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-slate-100 flex items-center gap-2">
                <Filter className="w-5 h-5 text-purple-400" />
                Filtros de Búsqueda
              </CardTitle>
              <CardDescription className="text-slate-400">
                Filtra operaciones según tus criterios
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="border-slate-600 text-slate-300 hover:bg-[#2a2d3a]"
            >
              {showFilters ? "Ocultar" : "Mostrar"} Filtros
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search Bar - Always Visible */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="Buscar por número de operación, origen, destino..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10 bg-[#2a2d3a] border-slate-600 text-slate-300 placeholder-slate-500 focus:border-purple-500"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Buscar
                </Button>
              </div>

              {/* Additional Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-700">
                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-2 block">
                      Estado
                    </label>
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="bg-[#2a2d3a] border-slate-600 text-slate-300">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        {OperationStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-2 block">
                      Tipo de Operación
                    </label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="bg-[#2a2d3a] border-slate-600 text-slate-300">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los tipos</SelectItem>
                        {OperationTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-2 block">
                      Cliente
                    </label>
                    <Select
                      value={clientFilter}
                      onValueChange={setClientFilter}
                    >
                      <SelectTrigger className="bg-[#2a2d3a] border-slate-600 text-slate-300">
                        <SelectValue placeholder="Cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los clientes</SelectItem>
                        {clients.map((client) => (
                          <SelectItem
                            key={client.id}
                            value={client.id.toString()}
                          >
                            {client.businessName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-2 block">
                      Proveedor
                    </label>
                    <Select
                      value={providerFilter}
                      onValueChange={setProviderFilter}
                    >
                      <SelectTrigger className="bg-[#2a2d3a] border-slate-600 text-slate-300">
                        <SelectValue placeholder="Proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          Todos los proveedores
                        </SelectItem>
                        {providers.map((provider) => (
                          <SelectItem
                            key={provider.id}
                            value={provider.id.toString()}
                          >
                            {provider.businessName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-2 block">
                      Fecha Inicio
                    </label>
                    <Input
                      type="date"
                      value={dateRangeFilter.start}
                      onChange={(e) =>
                        setDateRangeFilter({
                          ...dateRangeFilter,
                          start: e.target.value,
                        })
                      }
                      className="bg-[#2a2d3a] border-slate-600 text-slate-300"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-2 block">
                      Fecha Fin
                    </label>
                    <Input
                      type="date"
                      value={dateRangeFilter.end}
                      onChange={(e) =>
                        setDateRangeFilter({
                          ...dateRangeFilter,
                          end: e.target.value,
                        })
                      }
                      className="bg-[#2a2d3a] border-slate-600 text-slate-300"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Operations Table */}
        <Card className="bg-[#23262f] border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-slate-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-400" />
                Listado de Operaciones
              </CardTitle>
              <CardDescription className="text-slate-400">
                Total de {total} operaciones registradas
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-[#2a2d3a]"
                onClick={() => {
                  /* TODO: Implement export functionality */
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
                <p className="text-slate-400 mt-4">Cargando operaciones...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-red-400">{error}</p>
              </div>
            ) : operations.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-500">No se encontraron operaciones</p>
                <Button
                  onClick={handleCreateClick}
                  className="mt-4 bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Programar Primera Operación
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-slate-700 hover:bg-transparent">
                        <TableHead className="text-slate-400">
                          Nº Operación
                        </TableHead>
                        <TableHead className="text-slate-400">Tipo</TableHead>
                        <TableHead className="text-slate-400">
                          Origen → Destino
                        </TableHead>
                        <TableHead className="text-slate-400">
                          Cliente
                        </TableHead>
                        <TableHead className="text-slate-400">
                          Vehículo / Chofer
                        </TableHead>
                        <TableHead className="text-slate-400">
                          Fecha Programada
                        </TableHead>
                        <TableHead className="text-slate-400">Estado</TableHead>
                        <TableHead className="text-right text-slate-400">
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {operations.map((op) => (
                        <TableRow
                          key={op.operation.id}
                          className="border-b border-slate-700 hover:bg-[#2a2d3a]"
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium text-slate-200 font-mono">
                                {op.operation.operationNumber}
                              </div>
                              <div className="text-xs text-slate-500">
                                ID: {op.operation.id}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="border-purple-500/50 text-purple-400"
                            >
                              {getOperationTypeLabel(
                                op.operation.operationType
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-sm text-slate-300">
                                <MapPin className="w-3 h-3 text-green-400" />
                                {op.operation.origin}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-slate-300">
                                <MapPin className="w-3 h-3 text-red-400" />
                                {op.operation.destination}
                              </div>
                              {op.operation.distance && (
                                <div className="text-xs text-slate-500">
                                  {op.operation.distance} km
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {op.client ? (
                              <div className="text-sm">
                                <div className="text-slate-300">
                                  {op.client.businessName}
                                </div>
                                {op.client.industry && (
                                  <div className="text-xs text-slate-500">
                                    {op.client.industry}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-500 text-xs">
                                Sin cliente
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-sm text-slate-300">
                                <Truck className="w-3 h-3" />
                                {op.vehicle.plateNumber}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-slate-300">
                                <Users className="w-3 h-3" />
                                {op.driver.firstName} {op.driver.lastName}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm text-slate-300">
                                {formatDateTime(
                                  op.operation.scheduledStartDate
                                )}
                              </div>
                              {op.operation.scheduledEndDate && (
                                <div className="text-xs text-slate-500">
                                  Hasta:{" "}
                                  {formatDateTime(
                                    op.operation.scheduledEndDate
                                  )}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(op.operation.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/operations/${op.operation.id}`
                                  )
                                }
                                className="text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
                                title="Ver detalles"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditClick(op)}
                                className="text-slate-400 hover:text-purple-400 hover:bg-purple-500/10"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(op)}
                                className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
                  <p className="text-sm text-slate-400">
                    Mostrando {(page - 1) * limit + 1} a{" "}
                    {Math.min(page * limit, total)} de {total} operaciones
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="border-slate-600 text-slate-300 hover:bg-[#2a2d3a] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === totalPages ||
                          (p >= page - 1 && p <= page + 1)
                      )
                      .map((p, index, array) => (
                        <div key={p} className="flex items-center">
                          {index > 0 && array[index - 1] !== p - 1 && (
                            <span className="text-slate-500 px-2">...</span>
                          )}
                          <Button
                            variant={p === page ? "default" : "outline"}
                            onClick={() => setPage(p)}
                            className={
                              p === page
                                ? "bg-purple-600 hover:bg-purple-700 text-white"
                                : "border-slate-600 text-slate-300 hover:bg-[#2a2d3a]"
                            }
                          >
                            {p}
                          </Button>
                        </div>
                      ))}
                    <Button
                      variant="outline"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                      className="border-slate-600 text-slate-300 hover:bg-[#2a2d3a] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-[#23262f] border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-100">
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              ¿Estás seguro de que deseas eliminar la operación{" "}
              <strong className="text-slate-200">
                {operationToDelete?.operation.operationNumber}
              </strong>
              ? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="border-slate-600 text-slate-300 hover:bg-[#2a2d3a]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Operation Dialog */}
      <Dialog
        open={createDialogOpen || editDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditDialogOpen(false);
            setOperationToEdit(null);
            setError(null); // Clear error when closing dialog
          }
        }}
      >
        <DialogContent className="bg-[#23262f] border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-100">
              {editDialogOpen
                ? "Editar Operación"
                : "Nueva Programación de Operación"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {editDialogOpen
                ? "Actualiza la información de la operación"
                : "Completa la información para programar una nueva operación"}
            </DialogDescription>
          </DialogHeader>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-400">Error</p>
                <p className="text-sm text-red-300 mt-1">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Operation Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-300 border-b border-slate-700 pb-2">
                Información de la Operación
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {!editDialogOpen && (
                  <div className="col-span-2">
                    <Label htmlFor="operationNumber" className="text-slate-300">
                      Número de Operación *
                    </Label>
                    <Input
                      id="operationNumber"
                      value={formData.operationNumber || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          operationNumber: e.target.value,
                        })
                      }
                      required
                      className="bg-[#2a2d3a] border-slate-600 text-slate-300 mt-1"
                      placeholder="OP-12345"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="operationType" className="text-slate-300">
                    Tipo de Operación *
                  </Label>
                  <Select
                    value={formData.operationType || "delivery"}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        operationType:
                          value as (typeof OperationTypes)[number]["value"],
                      })
                    }
                  >
                    <SelectTrigger className="bg-[#2a2d3a] border-slate-600 text-slate-300 mt-1">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {OperationTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {editDialogOpen && (
                  <div>
                    <Label htmlFor="status" className="text-slate-300">
                      Estado
                    </Label>
                    <Select
                      value={formData.status || "scheduled"}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          status:
                            value as (typeof OperationStatuses)[number]["value"],
                        })
                      }
                    >
                      <SelectTrigger className="bg-[#2a2d3a] border-slate-600 text-slate-300 mt-1">
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {OperationStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            {/* Route Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-300 border-b border-slate-700 pb-2">
                Detalles del Traslado
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="origin" className="text-slate-300">
                    Origen *
                  </Label>
                  <Input
                    id="origin"
                    value={formData.origin || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, origin: e.target.value })
                    }
                    required
                    className="bg-[#2a2d3a] border-slate-600 text-slate-300 mt-1"
                    placeholder="Ej: Bodega Central, Santiago"
                  />
                </div>

                <div>
                  <Label htmlFor="destination" className="text-slate-300">
                    Destino *
                  </Label>
                  <Input
                    id="destination"
                    value={formData.destination || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, destination: e.target.value })
                    }
                    required
                    className="bg-[#2a2d3a] border-slate-600 text-slate-300 mt-1"
                    placeholder="Ej: Faena Minera, Antofagasta"
                  />
                </div>

                <div>
                  <Label htmlFor="routeId" className="text-slate-300">
                    Tramo/Ruta Asociada
                  </Label>
                  <Select
                    value={formData.routeId?.toString() || "none"}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        routeId:
                          value && value !== "none"
                            ? parseInt(value)
                            : undefined,
                      })
                    }
                  >
                    <SelectTrigger className="bg-[#2a2d3a] border-slate-600 text-slate-300 mt-1">
                      <SelectValue placeholder="Seleccionar ruta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin ruta asignada</SelectItem>
                      {routes.map((route) => (
                        <SelectItem key={route.id} value={route.id.toString()}>
                          {route.name} ({route.origin} → {route.destination})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="distance" className="text-slate-300">
                    Distancia (km)
                  </Label>
                  <Input
                    id="distance"
                    type="number"
                    value={formData.distance || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        distance: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      })
                    }
                    className="bg-[#2a2d3a] border-slate-600 text-slate-300 mt-1"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-300 border-b border-slate-700 pb-2">
                Programación
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="scheduledStartDate"
                    className="text-slate-300"
                  >
                    Fecha y Hora de Inicio *
                  </Label>
                  <Input
                    id="scheduledStartDate"
                    type="datetime-local"
                    value={formData.scheduledStartDate || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scheduledStartDate: e.target.value,
                      })
                    }
                    required
                    className="bg-[#2a2d3a] border-slate-600 text-slate-300 mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="scheduledEndDate" className="text-slate-300">
                    Fecha y Hora de Término
                  </Label>
                  <Input
                    id="scheduledEndDate"
                    type="datetime-local"
                    value={formData.scheduledEndDate || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scheduledEndDate: e.target.value,
                      })
                    }
                    className="bg-[#2a2d3a] border-slate-600 text-slate-300 mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Assignments */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-300 border-b border-slate-700 pb-2">
                Asignaciones
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientId" className="text-slate-300">
                    Cliente
                  </Label>
                  <Select
                    value={formData.clientId?.toString() || "none"}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        clientId:
                          value && value !== "none"
                            ? parseInt(value)
                            : undefined,
                      })
                    }
                  >
                    <SelectTrigger className="bg-[#2a2d3a] border-slate-600 text-slate-300 mt-1">
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin cliente</SelectItem>
                      {clients.map((client) => (
                        <SelectItem
                          key={client.id}
                          value={client.id.toString()}
                        >
                          {client.businessName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="providerId" className="text-slate-300">
                    Proveedor de Transporte
                  </Label>
                  <Select
                    value={formData.providerId?.toString() || "none"}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        providerId:
                          value && value !== "none"
                            ? parseInt(value)
                            : undefined,
                      })
                    }
                  >
                    <SelectTrigger className="bg-[#2a2d3a] border-slate-600 text-slate-300 mt-1">
                      <SelectValue placeholder="Seleccionar proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin proveedor</SelectItem>
                      {providers.map((provider) => (
                        <SelectItem
                          key={provider.id}
                          value={provider.id.toString()}
                        >
                          {provider.businessName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="driverId" className="text-slate-300">
                    Chofer *
                  </Label>
                  <Select
                    value={formData.driverId?.toString() || ""}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        driverId: parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger className="bg-[#2a2d3a] border-slate-600 text-slate-300 mt-1">
                      <SelectValue placeholder="Seleccionar chofer" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map((driver) => (
                        <SelectItem
                          key={driver.id}
                          value={driver.id.toString()}
                        >
                          {driver.firstName} {driver.lastName} - {driver.rut}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="vehicleId" className="text-slate-300">
                    Vehículo *
                  </Label>
                  <Select
                    value={formData.vehicleId?.toString() || ""}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        vehicleId: parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger className="bg-[#2a2d3a] border-slate-600 text-slate-300 mt-1">
                      <SelectValue placeholder="Seleccionar vehículo" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((vehicle) => (
                        <SelectItem
                          key={vehicle.id}
                          value={vehicle.id.toString()}
                        >
                          {vehicle.plateNumber} - {vehicle.brand}{" "}
                          {vehicle.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Cargo Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-300 border-b border-slate-700 pb-2">
                Detalles de la Carga
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="cargoDescription" className="text-slate-300">
                    Descripción de la Carga / Maquinaria
                  </Label>
                  <Textarea
                    id="cargoDescription"
                    value={formData.cargoDescription || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cargoDescription: e.target.value,
                      })
                    }
                    className="bg-[#2a2d3a] border-slate-600 text-slate-300 mt-1"
                    placeholder="Ej: Excavadora Caterpillar 320D, código: EXC-001"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="cargoWeight" className="text-slate-300">
                    Peso de la Carga (kg)
                  </Label>
                  <Input
                    id="cargoWeight"
                    type="number"
                    value={formData.cargoWeight || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cargoWeight: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      })
                    }
                    className="bg-[#2a2d3a] border-slate-600 text-slate-300 mt-1"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-300 border-b border-slate-700 pb-2">
                Observaciones y Notas
              </h3>

              <div>
                <Label htmlFor="notes" className="text-slate-300">
                  Notas y Condiciones Especiales
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="bg-[#2a2d3a] border-slate-600 text-slate-300 mt-1"
                  placeholder="Instrucciones especiales, condiciones del lugar, requisitos de seguridad..."
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  setEditDialogOpen(false);
                  setOperationToEdit(null);
                }}
                className="border-slate-600 text-slate-300 hover:bg-[#2a2d3a]"
                disabled={formLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={formLoading}
              >
                {formLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : editDialogOpen ? (
                  "Actualizar Operación"
                ) : (
                  "Programar Operación"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
