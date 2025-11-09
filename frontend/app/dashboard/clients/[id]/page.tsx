"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getToken, isAuthenticated, getUser, logout } from "@/lib/auth";
import {
  getClientById,
  getClientOperations,
  getClientStatistics,
  deleteClient,
} from "@/lib/api";
import type {
  Client,
  ClientStatistics,
  ClientOperation,
} from "@/types/clients";
import { INDUSTRIES } from "@/types/clients";
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
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Package,
  Edit,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DashboardSidebar, DashboardHeader } from "@/components/dashboard";

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = parseInt(params.id as string);

  const [mounted, setMounted] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
  const [statistics, setStatistics] = useState<ClientStatistics | null>(null);
  const [operations, setOperations] = useState<ClientOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Pagination for operations
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
    fetchClientData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, page]);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      // Fetch client details, statistics, and operations in parallel
      const [clientData, statsData, opsData] = await Promise.all([
        getClientById(token, clientId),
        getClientStatistics(token, clientId),
        getClientOperations(token, clientId, { page, limit }),
      ]);

      setClient(clientData);
      setStatistics(statsData);
      setOperations(opsData.data);
      setTotalPages(opsData.pagination.totalPages);
      setTotal(opsData.pagination.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar datos del cliente"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!client) return;

    try {
      const token = getToken();
      if (!token) return;

      await deleteClient(token, client.id);
      router.push("/dashboard/clients");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al eliminar cliente"
      );
    }
  };

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getIndustryLabel = (industry?: string | null) => {
    if (!industry) return "N/A";
    const found = INDUSTRIES.find((i) => i.value === industry);
    return found ? found.label : industry;
  };

  const getOperationStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: {
        label: "Programada",
        className: "bg-blue-500/10 text-blue-400 border-blue-500/50",
      },
      "in-progress": {
        label: "En Progreso",
        className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/50",
      },
      completed: {
        label: "Completada",
        className: "bg-green-500/10 text-green-400 border-green-500/50",
      },
      cancelled: {
        label: "Cancelada",
        className: "bg-red-500/10 text-red-400 border-red-500/50",
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      className: "bg-slate-500/10 text-slate-400 border-slate-500/50",
    };

    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const handleLogout = () => {
    logout();
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

  return (
    <div className="flex min-h-screen bg-[#2a2d3a]">
      {/* Sidebar */}
      <DashboardSidebar
        currentPath="/dashboard/clients"
        onNavigate={(path) => router.push(path)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <DashboardHeader user={user} onLogout={handleLogout} />

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[1400px] mx-auto space-y-6">
            {/* Back Button */}
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard/clients")}
              className="text-slate-400 hover:text-slate-300"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Clientes
            </Button>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-slate-400 mt-4">Cargando información...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-red-400">{error}</p>
              </div>
            ) : !client ? (
              <div className="text-center py-12">
                <p className="text-slate-400">Cliente no encontrado</p>
              </div>
            ) : (
              <>
                {/* Client Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
                      <Building2 className="w-8 h-8 text-blue-400" />
                      {client.businessName}
                    </h1>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge
                        variant={client.status ? "default" : "outline"}
                        className={
                          client.status
                            ? "bg-green-500/10 text-green-400 border-green-500/50"
                            : "border-slate-500/50 text-slate-500"
                        }
                      >
                        {client.status ? "Activo" : "Inactivo"}
                      </Badge>
                      {client.industry && (
                        <Badge
                          variant="outline"
                          className="border-blue-500/50 text-blue-400"
                        >
                          {getIndustryLabel(client.industry)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        router.push(`/dashboard/clients/${client.id}/edit`)
                      }
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      onClick={handleDeleteClick}
                      variant="outline"
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </Button>
                  </div>
                </div>

                {/* Client Information Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Contact Information */}
                  <Card className="bg-[#23262f] border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-slate-100 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-400" />
                        Información de Contacto
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                          RUT
                        </p>
                        <p className="text-slate-300 font-mono">
                          {client.taxId || "N/A"}
                        </p>
                      </div>
                      {client.contactName && (
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                            Contacto
                          </p>
                          <p className="text-slate-300">{client.contactName}</p>
                        </div>
                      )}
                      {client.contactEmail && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-slate-500" />
                          <a
                            href={`mailto:${client.contactEmail}`}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            {client.contactEmail}
                          </a>
                        </div>
                      )}
                      {client.contactPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-500" />
                          <a
                            href={`tel:${client.contactPhone}`}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            {client.contactPhone}
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Location Information */}
                  <Card className="bg-[#23262f] border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-slate-100 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-green-400" />
                        Ubicación
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {client.address && (
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                            Dirección
                          </p>
                          <p className="text-slate-300">{client.address}</p>
                        </div>
                      )}
                      {client.city && (
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                            Ciudad
                          </p>
                          <p className="text-slate-300">{client.city}</p>
                        </div>
                      )}
                      {client.region && (
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                            Región
                          </p>
                          <p className="text-slate-300">{client.region}</p>
                        </div>
                      )}
                      {client.country && (
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                            País
                          </p>
                          <p className="text-slate-300">{client.country}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Additional Information */}
                {(client.observations || client.notes) && (
                  <Card className="bg-[#23262f] border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-slate-100">
                        Información Adicional
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {client.observations && (
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                            Observaciones
                          </p>
                          <p className="text-slate-300">
                            {client.observations}
                          </p>
                        </div>
                      )}
                      {client.notes && (
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                            Notas Internas
                          </p>
                          <p className="text-slate-300">{client.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Statistics */}
                {statistics && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Card className="bg-[#23262f] border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-slate-400">
                              Total Operaciones
                            </p>
                            <p className="text-2xl font-bold text-slate-100 mt-1">
                              {statistics.totalOperations}
                            </p>
                          </div>
                          <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-blue-400" />
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
                              {statistics.completedOperations}
                            </p>
                          </div>
                          <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-400" />
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
                              {statistics.inProgressOperations}
                            </p>
                          </div>
                          <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 text-yellow-400" />
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
                              {statistics.scheduledOperations}
                            </p>
                          </div>
                          <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-purple-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-[#23262f] border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-slate-400">
                              Canceladas
                            </p>
                            <p className="text-2xl font-bold text-slate-100 mt-1">
                              {statistics.cancelledOperations}
                            </p>
                          </div>
                          <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Operations History */}
                <Card className="bg-[#23262f] border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-slate-100 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-400" />
                      Historial de Operaciones
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      {total > 0
                        ? `Total de ${total} operaciones registradas`
                        : "No hay operaciones registradas"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {operations.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-500">
                          No hay operaciones para este cliente
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="border-b border-slate-700 hover:bg-transparent">
                                <TableHead className="text-slate-400">
                                  N° Operación
                                </TableHead>
                                <TableHead className="text-slate-400">
                                  Tipo
                                </TableHead>
                                <TableHead className="text-slate-400">
                                  Origen → Destino
                                </TableHead>
                                <TableHead className="text-slate-400">
                                  Fecha Programada
                                </TableHead>
                                <TableHead className="text-slate-400">
                                  Chofer
                                </TableHead>
                                <TableHead className="text-slate-400">
                                  Vehículo
                                </TableHead>
                                <TableHead className="text-slate-400">
                                  Estado
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {operations.map((operation) => (
                                <TableRow
                                  key={operation.id}
                                  className="border-b border-slate-700 hover:bg-[#2a2d3a] cursor-pointer"
                                  onClick={() =>
                                    router.push(
                                      `/dashboard/operations/${operation.id}`
                                    )
                                  }
                                >
                                  <TableCell className="font-mono text-sm text-slate-300">
                                    {operation.operationNumber}
                                  </TableCell>
                                  <TableCell className="text-slate-300 capitalize">
                                    {operation.operationType}
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-sm">
                                      <div className="text-slate-300">
                                        {operation.origin}
                                      </div>
                                      <div className="text-slate-500 text-xs mt-1">
                                        → {operation.destination}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-slate-300 text-sm">
                                    {formatDateTime(
                                      operation.scheduledStartDate
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {operation.driver ? (
                                      <div className="text-sm text-slate-300">
                                        {operation.driver.firstName}{" "}
                                        {operation.driver.lastName}
                                      </div>
                                    ) : (
                                      <span className="text-slate-500 text-xs">
                                        N/A
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {operation.vehicle ? (
                                      <div className="text-sm">
                                        <div className="text-slate-300 font-mono">
                                          {operation.vehicle.plateNumber}
                                        </div>
                                        {operation.vehicle.brand &&
                                          operation.vehicle.model && (
                                            <div className="text-slate-500 text-xs mt-1">
                                              {operation.vehicle.brand}{" "}
                                              {operation.vehicle.model}
                                            </div>
                                          )}
                                      </div>
                                    ) : (
                                      <span className="text-slate-500 text-xs">
                                        N/A
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {getOperationStatusBadge(operation.status)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
                            <p className="text-sm text-slate-400">
                              Mostrando {(page - 1) * limit + 1} a{" "}
                              {Math.min(page * limit, total)} de {total}{" "}
                              operaciones
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
                              {Array.from(
                                { length: totalPages },
                                (_, i) => i + 1
                              )
                                .filter(
                                  (p) =>
                                    p === 1 ||
                                    p === totalPages ||
                                    (p >= page - 1 && p <= page + 1)
                                )
                                .map((p, index, array) => (
                                  <div key={p} className="flex items-center">
                                    {index > 0 &&
                                      array[index - 1] !== p - 1 && (
                                        <span className="text-slate-500 px-2">
                                          ...
                                        </span>
                                      )}
                                    <Button
                                      variant={
                                        p === page ? "default" : "outline"
                                      }
                                      onClick={() => setPage(p)}
                                      className={
                                        p === page
                                          ? "bg-blue-600 hover:bg-blue-700 text-white"
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
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-[#23262f] border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-100">
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              ¿Estás seguro de que deseas eliminar al cliente{" "}
              <strong className="text-slate-200">{client?.businessName}</strong>
              ? Esta acción marcará el cliente como inactivo.
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
    </div>
  );
}
