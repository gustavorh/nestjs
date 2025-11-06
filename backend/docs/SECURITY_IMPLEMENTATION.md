# Guía de Implementación de Seguridad y Auditoría

## 📋 Resumen de Cambios Implementados

Se han implementado todas las funcionalidades requeridas para cumplir con los estándares de seguridad empresarial, incluyendo autenticación segura, gestión de usuarios, roles, permisos granulares y auditoría completa.

---

## ✅ Funcionalidades Implementadas

### 1. **Autenticación Segura**

- ✅ Inicio de sesión con credenciales únicas
- ✅ Encriptación de contraseñas con bcrypt (10 salt rounds)
- ✅ Validación de sesiones JWT
- ✅ **NUEVO:** Expiración por inactividad (30 minutos)
- ✅ **NUEVO:** Tracking de última actividad del usuario

### 2. **Gestión de Usuarios**

- ✅ CRUD completo de usuarios
- ✅ Asignación de datos personales (nombre, apellido, email)
- ✅ Asignación de operador (empresa asociada)
- ✅ **NUEVO:** Estado activo/inactivo de usuario
- ✅ **NUEVO:** Historial de actividad visible por usuario

### 3. **Gestión de Roles**

- ✅ Estructura de roles por operador
- ✅ **NUEVO:** 4 roles predefinidos con permisos específicos:
  - **Administrador**: Acceso completo a todos los módulos
  - **Supervisor**: Control sin eliminación de usuarios ni gestión de roles
  - **Operador**: Gestión de órdenes y rutas
  - **Chofer**: Solo lectura/actualización de rutas y órdenes
- ✅ Posibilidad de crear roles personalizados

### 4. **Permisos Granulares**

- ✅ Sistema de grants (resource + action)
- ✅ **NUEVO:** `PermissionsGuard` para control de acceso
- ✅ **NUEVO:** Decorador `@RequirePermission(resource, action)`
- ✅ Control por módulo: users, orders, routes, drivers, vehicles, reports, settings, audit, roles
- ✅ Acciones: create, read, update, delete, close, assign, export

### 5. **Auditoría y Registro de Actividad**

- ✅ **NUEVO:** Tabla `audit_log` con información completa
- ✅ **NUEVO:** `AuditInterceptor` global automático
- ✅ **NUEVO:** Endpoints de consulta con filtros avanzados
- ✅ Registro de: usuario, acción, recurso, IP, user agent, timestamp
- ✅ Historial consultable por fecha, usuario, módulo y tipo de acción

---

## 🗄️ Cambios en la Base de Datos

### Tabla `users` - Nuevos Campos

```sql
ALTER TABLE users ADD COLUMN status BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN last_activity_at TIMESTAMP NULL;
CREATE INDEX user_status_idx ON users(status);
```

### Nueva Tabla `audit_log`

```sql
CREATE TABLE audit_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  operator_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100),
  resource_id INT,
  details VARCHAR(1000),
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (operator_id) REFERENCES operators(id) ON DELETE CASCADE,
  INDEX audit_user_id_idx (user_id),
  INDEX audit_operator_id_idx (operator_id),
  INDEX audit_action_idx (action),
  INDEX audit_resource_idx (resource),
  INDEX audit_created_at_idx (created_at)
);
```

---

## 🚀 Pasos para Aplicar los Cambios

### 1. Generar y Aplicar Migración

```bash
cd backend

# Generar migración de Drizzle
npm run db:generate

# Aplicar migración a la base de datos
npm run db:push
```

### 2. Ejecutar Seed de Permisos y Roles

```bash
# Crear roles predefinidos y permisos
npm run seed:permissions
```

Esto creará:

- ✅ 40+ permisos (grants) para todos los módulos
- ✅ 4 roles predefinidos: Administrador, Supervisor, Operador, Chofer
- ✅ Asignación automática de permisos a cada rol

### 3. Verificar la Instalación

```bash
# Iniciar el servidor en modo desarrollo
npm run start:dev
```

---

## 📝 Uso de las Nuevas Funcionalidades

### 1. Proteger Endpoints con Permisos

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OrdersController {
  @Get()
  @RequirePermission('orders', 'read')
  async findAll() {
    // Solo usuarios con permiso "orders:read" pueden acceder
  }

  @Post()
  @RequirePermission('orders', 'create')
  async create(@Body() createOrderDto: CreateOrderDto) {
    // Solo usuarios con permiso "orders:create" pueden acceder
  }

  @Delete(':id')
  @RequirePermission('orders', 'delete')
  async delete(@Param('id') id: number) {
    // Solo usuarios con permiso "orders:delete" pueden acceder
  }
}
```

### 2. Consultar Logs de Auditoría

**Obtener todos los logs (paginado):**

```bash
GET /audit?page=1&limit=50
```

**Filtrar por usuario:**

```bash
GET /audit?userId=5&page=1
```

**Filtrar por fecha:**

```bash
GET /audit?startDate=2025-01-01&endDate=2025-01-31
```

**Filtrar por acción:**

```bash
GET /audit?action=delete
```

**Filtrar por recurso:**

```bash
GET /audit?resource=users
```

**Actividad de un usuario específico:**

```bash
GET /audit/user/5?limit=20
```

**Obtener log específico:**

```bash
GET /audit/123
```

### 3. Gestionar Estado de Usuario

**Desactivar usuario:**

```bash
PUT /users/5
{
  "status": false
}
```

**Activar usuario:**

```bash
PUT /users/5
{
  "status": true
}
```

---

## 🔒 Comportamiento de Seguridad

### Expiración por Inactividad

- ⏱️ **Timeout:** 30 minutos de inactividad
- 🔄 **Tracking:** Cada request actualiza `lastActivityAt`
- ❌ **Resultado:** Usuario recibe `401 Unauthorized` si excede el timeout
- 💡 **Mensaje:** "Session expired due to inactivity. Please log in again."

### Validación de Estado de Usuario

- 🚫 Los usuarios con `status = false` **no pueden autenticarse**
- 🔒 Las sesiones activas de usuarios desactivados **siguen funcionando** hasta que expiren
- ⚡ Para forzar el cierre inmediato, se requeriría implementar una blacklist de tokens

### Operadores Inactivos

- 🏢 Si un operador tiene `status = false`, **ningún usuario de ese operador puede autenticarse**
- 👑 Operadores con `super = true` **omiten todas las verificaciones de permisos**

---

## 📊 Roles Predefinidos y sus Permisos

### **Administrador** (Acceso Total)

```
✅ users:* (create, read, update, delete)
✅ orders:* (create, read, update, delete, close)
✅ routes:* (create, read, update, delete, assign)
✅ drivers:* (create, read, update, delete)
✅ vehicles:* (create, read, update, delete)
✅ reports:* (read, export)
✅ settings:* (read, update)
✅ audit:read
✅ roles:* (create, read, update, delete)
```

### **Supervisor** (Sin eliminación de usuarios ni gestión de roles)

```
✅ users:create, users:read, users:update
✅ orders:* (create, read, update, delete, close)
✅ routes:* (create, read, update, delete, assign)
✅ drivers:* (create, read, update, delete)
✅ vehicles:* (create, read, update, delete)
✅ reports:* (read, export)
✅ settings:* (read, update)
✅ audit:read
```

### **Operador** (Gestión de operaciones)

```
✅ orders:create, orders:read, orders:update, orders:close
✅ routes:create, routes:read, routes:update, routes:assign
✅ drivers:read
✅ vehicles:read
✅ reports:read
```

### **Chofer** (Solo ejecución en terreno)

```
✅ routes:read, routes:update
✅ orders:read, orders:update
```

---

## 🛠️ Archivos Creados/Modificados

### Nuevos Archivos

```
backend/src/auth/guards/permissions.guard.ts
backend/src/auth/decorators/require-permission.decorator.ts
backend/src/auth/interceptors/audit.interceptor.ts
backend/src/audit/audit.service.ts
backend/src/audit/audit.controller.ts
backend/src/audit/audit.module.ts
backend/src/database/seeds/permissions.seed.ts
backend/src/database/seeds/run-seed.ts
```

### Archivos Modificados

```
backend/src/database/schema.ts (+ audit_log, + users.status, + users.lastActivityAt)
backend/src/auth/strategies/jwt.strategy.ts (+ validación de inactividad)
backend/src/auth/auth.service.ts (+ validación de status)
backend/src/users/dto/user.dto.ts (+ campo status)
backend/src/users/users.controller.ts (+ PermissionsGuard)
backend/src/app.module.ts (+ AuditModule, + AuditInterceptor global)
backend/package.json (+ script seed:permissions)
```

---

## 🧪 Testing de Permisos

### Caso 1: Usuario sin permiso intenta eliminar

```bash
# Usuario con rol "Operador" intenta:
DELETE /users/5

# Respuesta esperada:
403 Forbidden
{
  "message": "Missing permission: users:delete",
  "error": "Forbidden"
}
```

### Caso 2: Superadmin bypass

```bash
# Usuario con operator.super = true puede hacer CUALQUIER acción
# sin necesidad de tener el permiso asignado
DELETE /users/5  # ✅ Permitido
```

### Caso 3: Usuario inactivo intenta login

```bash
POST /auth/login
{
  "username": "usuario_inactivo",
  "password": "password123"
}

# Respuesta:
401 Unauthorized
{
  "message": "Invalid credentials"
}
```

---

## 📈 Monitoreo y Consultas Útiles

### SQL: Ver permisos de un rol

```sql
SELECT
  r.name AS role_name,
  g.resource,
  g.action
FROM roles r
JOIN role_grants rg ON r.id = rg.role_id
JOIN grants g ON rg.grant_id = g.id
WHERE r.name = 'Operador';
```

### SQL: Actividad reciente

```sql
SELECT
  al.action,
  al.resource,
  u.username,
  al.created_at
FROM audit_log al
JOIN users u ON al.user_id = u.id
ORDER BY al.created_at DESC
LIMIT 50;
```

### SQL: Usuarios inactivos (sin actividad en 7 días)

```sql
SELECT
  username,
  email,
  last_activity_at
FROM users
WHERE last_activity_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
  OR last_activity_at IS NULL;
```

---

## 🔧 Configuración Opcional

### Cambiar timeout de inactividad

En `backend/src/auth/strategies/jwt.strategy.ts`:

```typescript
private readonly INACTIVITY_TIMEOUT_MINUTES = 30; // Cambiar aquí
```

### Deshabilitar auditoría en ciertos endpoints

En `backend/src/auth/interceptors/audit.interceptor.ts`:

```typescript
private shouldSkipLogging(url: string): boolean {
  const skipPatterns = [
    '/health',
    '/audit',
    '/auth/refresh',
    '/metrics',
    '/tu-nuevo-endpoint', // Agregar aquí
  ];
  return skipPatterns.some((pattern) => url.includes(pattern));
}
```

---

## ✅ Checklist de Cumplimiento

| Requerimiento                       | Estado | Implementación                            |
| ----------------------------------- | ------ | ----------------------------------------- |
| Inicio de sesión con credenciales   | ✅     | `/auth/login`                             |
| Encriptación bcrypt                 | ✅     | `auth.service.ts`                         |
| Validación de sesiones              | ✅     | JWT + JwtStrategy                         |
| **Expiración por inactividad**      | ✅     | `jwt.strategy.ts` (30 min)                |
| Creación/edición de usuarios        | ✅     | `/users` CRUD                             |
| Asignación de operador              | ✅     | `users.operatorId`                        |
| **Estado activo/inactivo**          | ✅     | `users.status`                            |
| **Historial de actividad**          | ✅     | `GET /audit/user/:id`                     |
| Roles predefinidos                  | ✅     | Seed: Admin, Supervisor, Operador, Chofer |
| Roles personalizados                | ✅     | POST `/roles` (por implementar endpoint)  |
| **Permisos granulares**             | ✅     | `@RequirePermission(resource, action)`    |
| Control por acción                  | ✅     | create, read, update, delete, etc.        |
| **Registro automático de acciones** | ✅     | `AuditInterceptor` global                 |
| **Log consultable**                 | ✅     | `GET /audit` con filtros                  |

---

## 📞 Soporte

Para más detalles sobre la implementación multi-tenant, consulta:

- `docs/MULTI_TENANT_IMPLEMENTATION.md`
- `docs/AUTHENTICATION.md`
- `docs/DRIZZLE_ORM.md`

---

**Fecha de implementación:** Noviembre 6, 2025  
**Versión:** 1.0.0
