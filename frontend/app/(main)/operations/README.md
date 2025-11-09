# Módulo de Programación de Operaciones

## Descripción General

El módulo de **Programación de Operaciones** está diseñado para coordinar de forma estructurada y anticipada los traslados de origen a destino y de maquinaria hacia y desde las faenas de los clientes. Este módulo es crítico para preparar la logística, definir prioridades y garantizar la disponibilidad de recursos.

## Características Implementadas

### ✅ 1. Registro de Solicitudes de Traslado

El sistema permite crear órdenes de programación por cada movimiento, detallando:

- **Tipo de operación**:

  - Entrega (Bodega → Faena)
  - Retiro (Faena → Bodega)
  - Traslado
  - Transporte de Maquinaria
  - Servicio

- **Datos de Faena y Cliente**:

  - Cliente asociado a la operación
  - Información de contacto del cliente
  - Industria del cliente

- **Maquinaria Involucrada**:

  - Tipo de maquinaria (excavadora, bulldozer, etc.)
  - Código de maquinaria
  - Descripción detallada
  - Peso de la carga

- **Fechas y Horarios**:

  - Fecha y hora de disponibilidad (inicio programado)
  - Fecha y hora de requerimiento (término programado)
  - Duración estimada

- **Condiciones Especiales**:
  - Observaciones generales
  - Condiciones especiales del lugar
  - Instrucciones específicas

### ✅ 2. Asignación de Transportista

- **Selección de Proveedor**: Desde un mantenedor centralizado de proveedores de transporte
- **Asignación Manual**: Según condiciones preestablecidas (zonas, tipo de carga, disponibilidad)
- **Asignación de Recursos**:

  - Camión/vehículo (con auto-complete de vehículos activos)
  - Chofer (con validación de licencia y estado)
  - Posibilidad de indicar vehículo asignado por el proveedor

- **Notificación a Transportista** (preparado para implementar):
  - Emisión de orden de transporte
  - Confirmación de recepción y aceptación
  - Sistema de instrucciones especiales

### ✅ 3. Gestión Operacional

#### Visualización Principal

- **Vista de Lista**: Tabla completa con todas las operaciones
- **Vista de Calendario**: (Estructura preparada para implementación futura)

#### Filtros Avanzados

- Por estado (Programada, Confirmada, En Progreso, Completada, Cancelada, Retrasada)
- Por tipo de operación
- Por cliente
- Por proveedor de transporte
- Por rango de fechas
- Búsqueda por texto (número de operación, origen, destino)

#### Estadísticas en Tiempo Real

- Total de operaciones
- Operaciones programadas
- Operaciones en progreso
- Operaciones completadas
- Alertas de retrasos (estructura preparada)

### ✅ 4. Asociaciones de Datos

El módulo implementa todas las asociaciones requeridas:

- **Choferes → Vehículos**: Asignación directa y validada
- **Vehículos → Operaciones**: Trazabilidad completa de operaciones pasadas y futuras
- **Clientes → Operaciones**: Asociación directa con operaciones programadas y ejecutadas
- **Proveedores → Operaciones**: Vinculación de proveedores de transporte con operaciones
- **Tramos/Rutas → Operaciones**: Asociación con rutas predefinidas para cálculo de tiempos

## Estructura de Archivos

```
frontend/
├── app/
│   └── dashboard/
│       └── operations/
│           ├── page.tsx          # Página principal del módulo
│           └── README.md         # Este archivo
├── types/
│   └── operations.ts             # Definiciones de tipos TypeScript
└── lib/
    └── api.ts                    # Funciones API (actualizadas)
```

## Tipos de Datos

### Operation

```typescript
interface Operation {
  id: number;
  operatorId: number;
  clientId?: number | null;
  providerId?: number | null;
  routeId?: number | null;
  driverId: number;
  vehicleId: number;
  operationNumber: string;
  operationType: string;
  origin: string;
  destination: string;
  scheduledStartDate: string;
  scheduledEndDate?: string | null;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  distance?: number | null;
  status: string;
  cargoDescription?: string | null;
  cargoWeight?: number | null;
  notes?: string | null;
  // ... timestamps
}
```

### OperationWithDetails

Incluye información completa con datos relacionados de:

- Cliente
- Proveedor
- Ruta
- Chofer
- Vehículo

## API Endpoints Utilizados

- `GET /api/operations` - Listar operaciones con filtros
- `GET /api/operations/:id` - Obtener detalles de operación
- `POST /api/operations` - Crear nueva operación
- `PUT /api/operations/:id` - Actualizar operación
- `DELETE /api/operations/:id` - Eliminar operación

### Endpoints Preparados (para implementación futura)

- `POST /api/operations/assignments` - Asignar proveedor de transporte
- `PUT /api/operations/assignments/:id/confirm` - Confirmar asignación
- `GET /api/operations/:id/assignments` - Obtener asignaciones
- `POST /api/operations/transport-orders` - Crear orden de transporte
- `GET /api/operations/schedule/day` - Calendario diario
- `GET /api/operations/schedule/week` - Calendario semanal
- `GET /api/operations/schedule/month` - Calendario mensual

## Estados de Operación

1. **Programada** (scheduled): Operación creada y programada
2. **Confirmada** (confirmed): Confirmada por todas las partes
3. **En Progreso** (in-progress): Operación en ejecución
4. **Completada** (completed): Operación finalizada exitosamente
5. **Cancelada** (cancelled): Operación cancelada
6. **Retrasada** (delayed): Operación con retrasos

## Validaciones Implementadas

- Cliente, Proveedor, Chofer y Vehículo deben pertenecer al mismo operador
- Chofer debe estar activo
- Vehículo debe estar activo
- Número de operación debe ser único por operador
- Fechas de inicio y término deben ser válidas

## Funcionalidades Pendientes de Implementación

### 🔲 Calendario Operacional

- [ ] Vista de calendario mensual
- [ ] Vista semanal
- [ ] Filtros por faena
- [ ] Alertas de conflictos de programación
- [ ] Drag & drop para reprogramar operaciones

### 🔲 Sistema de Notificaciones

- [ ] Notificación automática a proveedores
- [ ] Confirmación de recepción
- [ ] Sistema de mensajería integrado
- [ ] Notificaciones por email/SMS

### 🔲 Órdenes de Transporte

- [ ] Generación automática de órdenes
- [ ] Adjuntar documentos
- [ ] Firma digital
- [ ] Tracking de entregas

### 🔲 Reportes y Analytics

- [ ] Dashboard de KPIs operacionales
- [ ] Reportes de cumplimiento
- [ ] Análisis de tiempos
- [ ] Costos por operación
- [ ] Rendimiento de proveedores

### 🔲 Integración GPS

- [ ] Tracking en tiempo real
- [ ] Geofencing
- [ ] ETA dinámico
- [ ] Alertas de desvío

## Uso

### Crear Nueva Operación

1. Click en "Nueva Operación"
2. Completar información básica:
   - Número de operación (auto-generado)
   - Tipo de operación
   - Origen y destino
3. Asignar recursos:
   - Cliente (opcional)
   - Proveedor (opcional)
   - Chofer (requerido)
   - Vehículo (requerido)
   - Ruta (opcional)
4. Definir programación:
   - Fecha y hora de inicio
   - Fecha y hora de término (opcional)
5. Agregar detalles de carga
6. Notas y observaciones

### Filtrar Operaciones

1. Click en "Mostrar Filtros"
2. Seleccionar criterios:
   - Estado
   - Tipo de operación
   - Cliente
   - Proveedor
   - Rango de fechas
3. Click en "Buscar"

### Editar Operación

1. Click en el ícono de editar en la operación
2. Modificar campos necesarios
3. Guardar cambios

### Eliminar Operación

1. Click en el ícono de eliminar
2. Confirmar eliminación
3. La operación será eliminada permanentemente

## Permisos Requeridos

- `operations:read` - Ver operaciones
- `operations:create` - Crear operaciones
- `operations:update` - Actualizar operaciones
- `operations:delete` - Eliminar operaciones

## Notas Técnicas

- El módulo usa React Server Components para mejor rendimiento
- Implementa paginación del lado del servidor
- Validación de formularios en tiempo real
- Manejo de errores con feedback visual
- Diseño responsive para dispositivos móviles

## Próximos Pasos Recomendados

1. **Implementar Backend Completo**:

   - Crear endpoints de asignación de transportistas
   - Implementar sistema de órdenes de transporte
   - Crear endpoints de calendario

2. **Vista de Calendario**:

   - Integrar librería de calendario (ej: FullCalendar)
   - Implementar drag & drop
   - Sistema de alertas de conflictos

3. **Sistema de Notificaciones**:

   - Email templates
   - SMS integration
   - Push notifications

4. **Documentos y Archivos**:

   - Upload de documentos adjuntos
   - Generación de PDF de órdenes de transporte
   - Firma digital

5. **Analytics y Reportes**:
   - Dashboard de KPIs
   - Gráficos de tendencias
   - Exportación de datos

## Soporte

Para preguntas o problemas, contactar al equipo de desarrollo.
