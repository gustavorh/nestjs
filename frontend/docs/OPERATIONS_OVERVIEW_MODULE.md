# Módulo de Vista General de Operaciones en Línea - Documentación de Implementación

## Descripción General

Este documento describe la implementación del **Módulo de Vista General de Operaciones en Línea**, un panel centralizado y dinámico que permite a supervisores y operadores tener control completo y en tiempo real de todas las operaciones de traslado de maquinaria.

## Características Implementadas

### ✅ 1. Visualización en Tiempo Real

- **Dashboard interactivo** con actualización automática de estados
- **Visualización de operaciones activas** desde programación hasta finalización
- **Indicador visual de actualización en tiempo real** con animación pulsante
- **Tabla de operaciones** con información detallada de cada traslado

### ✅ 2. Gestión de Estados

El sistema soporta los siguientes estados de operaciones:

- 📅 **Programada** (Scheduled) - Operación planificada
- ✓ **Confirmada** (Confirmed) - Operación confirmada
- 🚚 **En Tránsito** (In Progress) - Operación en curso
- ✓✓ **Completada** (Completed) - Operación finalizada
- ✕ **Cancelada** (Cancelled) - Operación cancelada
- ⚠ **Retrasada** (Delayed) - Operación con retraso

Cada estado incluye:

- Color distintivo
- Icono representativo
- Indicador de progreso (para operaciones en tránsito)
- Alertas de retrasos o incidentes

### ✅ 3. Filtros Avanzados

Componente `OperationsFilters` con capacidades de filtrado por:

#### Filtros Rápidos (Siempre Visibles)

- **Búsqueda por texto**: ID de operación, origen, destino
- **Estado**: Todos los estados de operación
- **Tipo de operación**: Entrega, Retiro, Traslado, Transporte, Servicio
- **Cliente**: Selección de clientes activos
- **Período de tiempo**: Hoy, Ayer, Esta Semana, Este Mes, Personalizado

#### Filtros Expandibles

- **Tramo/Ruta**: Filtro por rutas específicas
- **Chofer**: Filtro por conductor asignado
- **Vehículo**: Filtro por vehículo específico
- **Proveedor**: Filtro por proveedor de transporte

Características adicionales:

- Contador de filtros activos
- Botón de limpiar filtros
- Selector de fechas personalizadas
- Interfaz expandible/colapsable

### ✅ 4. Indicadores de Rendimiento (KPIs)

Componente `PerformanceMetricsPanel` que muestra:

#### Métricas Principales

1. **Operaciones Totales**

   - Total de operaciones
   - Operaciones en tránsito
   - Icono distintivo

2. **Cumplimiento de Horarios**

   - Porcentaje de cumplimiento
   - Entregas a tiempo
   - Indicador visual de éxito

3. **Tiempo Promedio de Viaje**

   - Tiempo en horas
   - Distancia promedio en km
   - Icono de reloj

4. **Incidentes**
   - Total de incidentes
   - Incidentes críticos
   - Icono de alerta

#### Distribución de Estados

- Gráfico de barras horizontal
- Porcentaje de cada estado
- Conteo numérico
- Código de colores por estado

#### Análisis de Incidentes

- Desglose por tipo de incidente
- Visualización proporcional
- Identificación de patrones

#### Métricas de Eficiencia

- Distancia total recorrida
- Tasa de utilización de vehículos
- Operaciones activas

### ✅ 5. Tabla de Operaciones en Tiempo Real

Componente `OperationsTable` con:

#### Columnas de Información

1. **ID / Fecha**: Número de operación y fecha programada
2. **Cliente**: Nombre del cliente e industria
3. **Ruta**: Origen, destino y distancia
4. **Tipo**: Tipo de operación
5. **Vehículo**: Patente, marca y modelo
6. **Chofer**: Nombre y tipo de licencia
7. **Estado**: Estado actual con indicadores visuales
8. **Progreso**: Barra de progreso y ETA para operaciones en tránsito
9. **Acciones**: Botones de ver detalles y rastrear

#### Características Especiales

- **Indicadores de retraso**: Minutos de retraso mostrados
- **Alertas de incidentes**: Contador de incidentes activos
- **Barra de progreso**: Para operaciones en tránsito
- **ETA (Tiempo estimado de llegada)**: Hora estimada de finalización
- **Acciones rápidas**: Ver detalles y rastrear en tiempo real
- **Hover effects**: Resaltado al pasar el mouse
- **Click handler**: Navegación a detalles de operación

#### Estados de Visualización

- Loading state con spinner
- Empty state con mensaje informativo
- Responsive table con scroll horizontal

### ✅ 6. Reporte y Visualización de Eventos

El sistema incluye:

- **Tipo de incidentes soportados**:

  - Retrasos (delay)
  - Fallas mecánicas (breakdown)
  - Accidentes (accident)
  - Condiciones climáticas (weather)
  - Cierre de rutas (road_closure)
  - Otros (other)

- **Niveles de severidad**:

  - Bajo (low)
  - Medio (medium)
  - Alto (high)
  - Crítico (critical)

- **Información de incidentes**:
  - Descripción detallada
  - Fecha y hora de reporte
  - Ubicación (si aplica)
  - Estado de resolución
  - Impacto en la operación

### ✅ 7. Interfaz Intuitiva y Responsiva

#### Responsive Design

- **Mobile**: Diseño optimizado para pantallas pequeñas
- **Tablet**: Layout de 2 columnas
- **Desktop**: Layout de 4 columnas para KPIs
- **Large screens**: Máximo ancho de 1600px con centrado

#### Accesibilidad

- Esquema de colores compatible con tema oscuro/claro
- Iconos descriptivos
- Tooltips informativos
- Estados de loading claros
- Mensajes de error amigables

#### Navegación

- Header con título descriptivo
- Indicador de actualización en tiempo real
- Botones de acción intuitivos
- Breadcrumbs (implementable)

## Arquitectura de Componentes

### Estructura de Archivos

```
frontend/
├── types/
│   └── dashboard.ts                    # Tipos TypeScript para dashboard
├── components/
│   └── dashboard/
│       ├── OperationsFilters.tsx       # Componente de filtros avanzados
│       ├── OperationsTable.tsx         # Tabla de operaciones
│       ├── PerformanceMetricsPanel.tsx # Panel de métricas KPI
│       └── index.ts                    # Exportaciones
└── app/
    └── dashboard/
        └── page.tsx                    # Página principal del dashboard
```

### Tipos de Datos Principales

#### `DashboardFilters`

```typescript
interface DashboardFilters {
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
```

#### `LiveOperation`

```typescript
interface LiveOperation extends OperationWithDetails {
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
```

#### `PerformanceMetrics`

```typescript
interface PerformanceMetrics {
  averageTravelTime: number;
  totalOperations: number;
  completedOperations: number;
  activeOperations: number;
  onTimeDeliveries: number;
  delayedOperations: number;
  scheduleComplianceRate: number;
  totalIncidents: number;
  incidentsByType: Record<string, number>;
  criticalIncidents: number;
  totalDistance: number;
  averageDistance: number;
  utilizationRate: number;
  // ... más campos
}
```

## Integración con Backend

### Endpoints Utilizados

1. **GET /api/operations**

   - Parámetros de filtrado
   - Paginación
   - Respuesta con datos detallados

2. **GET /api/clients**

   - Para opciones de filtro

3. **GET /api/providers**

   - Para opciones de filtro

4. **GET /api/routes**

   - Para opciones de filtro

5. **GET /api/drivers**

   - Para opciones de filtro

6. **GET /api/vehicles**
   - Para opciones de filtro

### Flujo de Datos

1. **Carga inicial**:

   - Verificación de autenticación
   - Carga de opciones de filtros
   - Carga de operaciones con filtros por defecto (hoy)

2. **Actualización por filtros**:

   - Usuario modifica filtros
   - Re-fetch de operaciones con nuevos parámetros
   - Actualización de métricas calculadas

3. **Cálculo de métricas**:
   - Procesamiento client-side de datos
   - Cálculos estadísticos en tiempo real
   - Actualización de visualizaciones

## Características Técnicas

### Performance

- **Lazy loading**: Componentes cargados según necesidad
- **Memoización**: React hooks para evitar re-renders innecesarios
- **Paginación**: Carga eficiente de grandes conjuntos de datos
- **Debouncing**: Para búsquedas y filtros en tiempo real

### Estado de la Aplicación

- **useState**: Para estado local de componentes
- **useEffect**: Para efectos secundarios y carga de datos
- **Props drilling**: Minimizado con composición de componentes

### Manejo de Errores

- Try-catch en todas las llamadas API
- Estados de loading
- Mensajes de error amigables
- Fallbacks visuales

## Próximas Mejoras Sugeridas

### Funcionalidades

1. **WebSockets** para actualizaciones en tiempo real
2. **Notificaciones push** para eventos críticos
3. **Exportación de reportes** en PDF/Excel
4. **Gráficos avanzados** con Chart.js o Recharts
5. **Mapa en tiempo real** para rastreo de vehículos
6. **Historial de cambios** de estado
7. **Sistema de alertas** configurable
8. **Dashboard personalizable** por usuario

### Optimizaciones

1. **React Query** para cache y sincronización
2. **Virtual scrolling** para tablas grandes
3. **Service Workers** para offline support
4. **Progressive Web App** (PWA)
5. **Code splitting** avanzado
6. **Server-Side Rendering** (SSR) con Next.js App Router

### UX/UI

1. **Tour guiado** para nuevos usuarios
2. **Shortcuts de teclado**
3. **Temas personalizables**
4. **Vistas guardadas** de filtros
5. **Widgets arrastrables**
6. **Comparación de períodos**

## Conclusión

El Módulo de Vista General de Operaciones en Línea proporciona una solución completa y moderna para el monitoreo y gestión de operaciones de traslado. Con su interfaz intuitiva, filtros avanzados, y métricas de rendimiento en tiempo real, facilita la toma de decisiones rápidas y efectivas para supervisores y operadores.

La arquitectura modular y escalable permite futuras expansiones y mejoras, mientras que el diseño responsivo asegura accesibilidad desde cualquier dispositivo.

## Contacto y Soporte

Para preguntas o soporte sobre este módulo, consulte la documentación adicional en:

- `/frontend/docs/QUICK_START_THEME.md`
- `/frontend/docs/THEME_REFACTORING_SUMMARY.md`

---

**Versión**: 1.0.0  
**Fecha**: Noviembre 2025  
**Autor**: Sistema de Desarrollo
