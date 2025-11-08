"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getToken, isAuthenticated, getUser, logout } from "@/lib/auth";
import {
  getTruckById,
  getTruckDocuments,
  getTruckOperationHistory,
  getTruckUpcomingOperations,
} from "@/lib/api";
import type { Truck, TruckDocument, TruckOperation } from "@/types/trucks";
import {
  VEHICLE_TYPES,
  OPERATIONAL_STATUS,
  DOCUMENT_TYPES,
} from "@/types/trucks";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Edit,
  FileText,
  TruckIcon,
  Calendar,
  Package,
  Clock,
  MapPin,
} from "lucide-react";
import { DashboardSidebar, DashboardHeader } from "@/components/dashboard";

export default function TruckDetailPage() {
  const router = useRouter();
  const params = useParams();
  const truckId = params?.id ? parseInt(params.id as string) : null;

  const [mounted, setMounted] = useState(false);
  const [truck, setTruck] = useState<Truck | null>(null);
  const [documents, setDocuments] = useState<TruckDocument[]>([]);
  const [operationHistory, setOperationHistory] = useState<TruckOperation[]>(
    []
  );
  const [upcomingOperations, setUpcomingOperations] = useState<
    TruckOperation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    setMounted(true);
    if (truckId) {
      fetchTruckData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [truckId]);

  const fetchTruckData = async () => {
    if (!truckId) return;

    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      const [truckData, docsData, historyData, upcomingData] =
        await Promise.all([
          getTruckById(token, truckId),
          getTruckDocuments(token, truckId),
          getTruckOperationHistory(token, truckId),
          getTruckUpcomingOperations(token, truckId),
        ]);

      setTruck(truckData);
      setDocuments(docsData);
      setOperationHistory(historyData);
      setUpcomingOperations(upcomingData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar datos del camión"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-CL");
  };

  const getVehicleTypeLabel = (type: string) => {
    return VEHICLE_TYPES.find((vt) => vt.value === type)?.label || type;
  };

  const getOperationalStatusInfo = (status?: string) => {
    if (!status) return OPERATIONAL_STATUS[0];
    return (
      OPERATIONAL_STATUS.find((s) => s.value === status) ||
      OPERATIONAL_STATUS[0]
    );
  };

  const getDocumentTypeLabel = (type: string) => {
    return DOCUMENT_TYPES.find((dt) => dt.value === type)?.label || type;
  };

  const handleLogout = () => {
    logout();
  };

  const user = getUser();

  // Show loading state
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#2a2d3a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-slate-300 mt-4">Cargando...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#2a2d3a]">
        <div className="text-center max-w-md">
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6">
            <p className="text-red-400 mb-4">{error}</p>
            <Button
              onClick={() => router.push("/dashboard/trucks")}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Camiones
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // No user or no truck data
  if (!user || !truck) {
    return null;
  }

  const opStatus = getOperationalStatusInfo(truck.operationalStatus);

  return (
    <div className="flex min-h-screen bg-[#2a2d3a]">
      <DashboardSidebar
        currentPath="/dashboard/trucks"
        onNavigate={(path) => router.push(path)}
      />

      <div className="flex-1 flex flex-col">
        <DashboardHeader user={user} onLogout={handleLogout} />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[1400px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard/trucks")}
                  className="border-slate-600 text-slate-300 hover:bg-[#23262f]"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                    <TruckIcon className="w-6 h-6 text-blue-400" />
                    Detalle del Camión: {truck.plateNumber}
                  </h1>
                  <p className="text-slate-400 mt-1">
                    {truck.brand} {truck.model} ({truck.year})
                  </p>
                </div>
              </div>
              <Button
                onClick={() =>
                  router.push(`/dashboard/trucks/${truck.id}/edit`)
                }
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </div>

            {error && (
              <Card className="bg-red-500/10 border-red-500/50">
                <CardContent className="p-4">
                  <p className="text-red-400">{error}</p>
                </CardContent>
              </Card>
            )}

            {/* Basic Information */}
            <Card className="bg-[#23262f] border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100">
                  Información General
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      Patente
                    </p>
                    <p className="text-lg font-bold text-slate-100 mt-1">
                      {truck.plateNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400">Marca</p>
                    <p className="text-lg text-slate-100 mt-1">
                      {truck.brand || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400">Modelo</p>
                    <p className="text-lg text-slate-100 mt-1">
                      {truck.model || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400">Año</p>
                    <p className="text-lg text-slate-100 mt-1">
                      {truck.year || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      Tipo de Vehículo
                    </p>
                    <Badge
                      variant="outline"
                      className="mt-1 border-blue-500/50 text-blue-400"
                    >
                      {getVehicleTypeLabel(truck.vehicleType)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      Capacidad
                    </p>
                    <p className="text-lg text-slate-100 mt-1">
                      {truck.capacity
                        ? `${truck.capacity} ${truck.capacityUnit || ""}`
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400">VIN</p>
                    <p className="text-sm font-mono text-slate-100 mt-1">
                      {truck.vin || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400">Color</p>
                    <p className="text-lg text-slate-100 mt-1">
                      {truck.color || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      Estado Operativo
                    </p>
                    <Badge
                      variant="outline"
                      className={`mt-1 border-${opStatus.color}-500/50 text-${opStatus.color}-400`}
                    >
                      {opStatus.label}
                    </Badge>
                  </div>
                </div>
                {truck.notes && (
                  <div className="mt-6 pt-6 border-t border-slate-700">
                    <p className="text-xs font-medium text-slate-400">Notas</p>
                    <p className="text-sm text-slate-300 mt-2">{truck.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documents */}
            <Card className="bg-[#23262f] border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  Documentos ({documents.length})
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Documentación vigente del vehículo
                </CardDescription>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">
                    No hay documentos registrados
                  </p>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 bg-[#2a2d3a] rounded-lg border border-slate-700"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-slate-200">
                            {doc.documentName}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {getDocumentTypeLabel(doc.documentType)}
                          </p>
                        </div>
                        {doc.expirationDate && (
                          <div className="text-right">
                            <p className="text-xs text-slate-400">
                              Vencimiento
                            </p>
                            <p className="text-sm text-slate-300">
                              {formatDate(doc.expirationDate)}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Operations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Operations */}
              <Card className="bg-[#23262f] border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-100 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-400" />
                    Operaciones Próximas ({upcomingOperations.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingOperations.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">
                      No hay operaciones próximas
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {upcomingOperations.slice(0, 5).map((op) => (
                        <div
                          key={op.id}
                          className="p-3 bg-[#2a2d3a] rounded-lg border border-slate-700"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-slate-200">
                              {op.operationNumber}
                            </p>
                            <Badge
                              variant="outline"
                              className="border-purple-500/50 text-purple-400"
                            >
                              {op.status}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-xs text-slate-400">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3 h-3" />
                              {op.origin} → {op.destination}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              {formatDate(op.scheduledStartDate)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Operation History */}
              <Card className="bg-[#23262f] border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-100 flex items-center gap-2">
                    <Package className="w-5 h-5 text-green-400" />
                    Historial de Operaciones ({operationHistory.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {operationHistory.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">
                      No hay historial de operaciones
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {operationHistory.slice(0, 5).map((op) => (
                        <div
                          key={op.id}
                          className="p-3 bg-[#2a2d3a] rounded-lg border border-slate-700"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-slate-200">
                              {op.operationNumber}
                            </p>
                            <Badge
                              variant="outline"
                              className="border-green-500/50 text-green-400"
                            >
                              {op.status}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-xs text-slate-400">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3 h-3" />
                              {op.origin} → {op.destination}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              {formatDate(op.scheduledStartDate)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
