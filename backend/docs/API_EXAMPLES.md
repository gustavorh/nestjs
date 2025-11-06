# Ejemplos de Uso de la API - Seguridad y Auditoría

Esta guía contiene ejemplos prácticos de cómo usar las nuevas funcionalidades de seguridad implementadas.

---

## 🔐 Autenticación

### Login Normal

```bash
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password123"
}
```

**Respuesta:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "firstName": "Admin",
    "lastName": "User",
    "operatorId": 1,
    "roleId": 1,
    "operator": {
      "id": 1,
      "name": "Default Operator",
      "super": false,
      "status": true
    },
    "role": {
      "id": 1,
      "name": "Administrador"
    }
  }
}
```

### Login con Usuario Inactivo

```bash
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "username": "usuario_inactivo",
  "password": "password123"
}
```

**Respuesta:**

```json
{
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

---

## 👥 Gestión de Usuarios

### Crear Usuario (requiere permiso `users:create`)

```bash
POST http://localhost:3000/users
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "username": "operador1",
  "email": "operador1@example.com",
  "password": "SecurePass123!",
  "firstName": "Juan",
  "lastName": "Pérez",
  "operatorId": 1,
  "roleId": 3,
  "status": true
}
```

### Desactivar Usuario (requiere permiso `users:update`)

```bash
PUT http://localhost:3000/users/5
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "status": false
}
```

### Eliminar Usuario (requiere permiso `users:delete`)

```bash
DELETE http://localhost:3000/users/5
Authorization: Bearer {{access_token}}
```

**Respuesta si NO tiene permiso:**

```json
{
  "statusCode": 403,
  "message": "Missing permission: users:delete",
  "error": "Forbidden"
}
```

---

## 📊 Auditoría

### Consultar Todos los Logs (con paginación)

```bash
GET http://localhost:3000/audit?page=1&limit=50
Authorization: Bearer {{access_token}}
```

**Respuesta:**

```json
{
  "data": [
    {
      "id": 145,
      "userId": 2,
      "operatorId": 1,
      "action": "delete_users",
      "resource": "users",
      "resourceId": 5,
      "details": "{\"resourceId\":5}",
      "ipAddress": "::1",
      "userAgent": "PostmanRuntime/7.32.0",
      "createdAt": "2025-11-06T15:30:45.000Z",
      "user": {
        "id": 2,
        "username": "admin",
        "firstName": "Admin",
        "lastName": "User"
      },
      "operator": {
        "id": 1,
        "name": "Default Operator"
      }
    }
    // ... más logs
  ],
  "total": 234,
  "page": 1,
  "limit": 50
}
```

### Filtrar por Usuario Específico

```bash
GET http://localhost:3000/audit?userId=2&page=1&limit=20
Authorization: Bearer {{access_token}}
```

### Filtrar por Rango de Fechas

```bash
GET http://localhost:3000/audit?startDate=2025-11-01&endDate=2025-11-06
Authorization: Bearer {{access_token}}
```

### Filtrar por Acción

```bash
GET http://localhost:3000/audit?action=delete
Authorization: Bearer {{access_token}}
```

### Filtrar por Recurso

```bash
GET http://localhost:3000/audit?resource=users
Authorization: Bearer {{access_token}}
```

### Filtros Combinados

```bash
GET http://localhost:3000/audit?userId=2&resource=users&action=delete&startDate=2025-11-01
Authorization: Bearer {{access_token}}
```

### Actividad Reciente de un Usuario

```bash
GET http://localhost:3000/audit/user/2?limit=20
Authorization: Bearer {{access_token}}
```

**Respuesta:**

```json
[
  {
    "id": 150,
    "userId": 2,
    "operatorId": 1,
    "action": "update_users",
    "resource": "users",
    "resourceId": 8,
    "details": "{\"body\":{\"status\":false}}",
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "createdAt": "2025-11-06T16:45:22.000Z",
    "user": {
      "id": 2,
      "username": "admin",
      "firstName": "Admin",
      "lastName": "User"
    },
    "operator": {
      "id": 1,
      "name": "Default Operator"
    }
  }
  // ... últimas 19 acciones
]
```

### Obtener un Log Específico

```bash
GET http://localhost:3000/audit/145
Authorization: Bearer {{access_token}}
```

---

## 🔒 Pruebas de Permisos

### Caso 1: Operador intenta eliminar usuarios (sin permiso)

**Request:**

```bash
DELETE http://localhost:3000/users/5
Authorization: Bearer {{operador_token}}
```

**Respuesta:**

```json
{
  "statusCode": 403,
  "message": "Missing permission: users:delete",
  "error": "Forbidden"
}
```

**Log de Auditoría Generado:**

```json
{
  "action": "delete_users",
  "resource": "users",
  "details": "{\"error\":\"Missing permission: users:delete\"}",
  "userId": 3,
  "operatorId": 1
}
```

### Caso 2: Supervisor crea una orden (con permiso)

**Request:**

```bash
POST http://localhost:3000/orders
Authorization: Bearer {{supervisor_token}}
Content-Type: application/json

{
  "clientName": "Empresa XYZ",
  "destination": "Santiago Centro",
  "weight": 150
}
```

**Respuesta:**

```json
{
  "id": 42,
  "clientName": "Empresa XYZ",
  "destination": "Santiago Centro",
  "weight": 150,
  "status": "pending"
}
```

**Log de Auditoría Generado:**

```json
{
  "action": "create_orders",
  "resource": "orders",
  "resourceId": 42,
  "details": "{\"body\":{\"clientName\":\"Empresa XYZ\",\"destination\":\"Santiago Centro\",\"weight\":150}}",
  "userId": 4,
  "operatorId": 1
}
```

### Caso 3: Chofer intenta crear una ruta (sin permiso)

**Request:**

```bash
POST http://localhost:3000/routes
Authorization: Bearer {{chofer_token}}
Content-Type: application/json

{
  "name": "Ruta Norte",
  "driverId": 10
}
```

**Respuesta:**

```json
{
  "statusCode": 403,
  "message": "Missing permission: routes:create",
  "error": "Forbidden"
}
```

---

## ⏱️ Expiración por Inactividad

### Escenario: Usuario sin actividad por 31 minutos

**Primera Request (exitosa):**

```bash
GET http://localhost:3000/users
Authorization: Bearer {{access_token}}

# Respuesta: 200 OK
# last_activity_at actualizado a: 2025-11-06 14:00:00
```

**[31 minutos después]**

**Segunda Request (rechazada):**

```bash
GET http://localhost:3000/users
Authorization: Bearer {{access_token}}

# Respuesta:
{
  "statusCode": 401,
  "message": "Session expired due to inactivity. Please log in again.",
  "error": "Unauthorized"
}
```

**Solución:**

```bash
# Usuario debe volver a autenticarse
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "username": "operador1",
  "password": "SecurePass123!"
}
```

---

## 🛡️ Super Operators Bypass

### Escenario: Operator Super puede hacer TODO

El usuario pertenece a un operator con `super = true`:

```bash
# ✅ Eliminar usuarios (sin tener el permiso explícito)
DELETE http://localhost:3000/users/10
Authorization: Bearer {{super_admin_token}}

# ✅ Acceder a cualquier módulo
GET http://localhost:3000/settings
Authorization: Bearer {{super_admin_token}}

# ✅ Todas las acciones permitidas
POST/PUT/DELETE http://localhost:3000/cualquier-endpoint
Authorization: Bearer {{super_admin_token}}
```

**Nota:** Los super operators ignoran completamente el `PermissionsGuard`.

---

## 📋 Colección Postman

### Variables de Entorno

```json
{
  "base_url": "http://localhost:3000",
  "access_token": "",
  "admin_token": "",
  "supervisor_token": "",
  "operador_token": "",
  "chofer_token": ""
}
```

### Script Post-Login (en request de login)

```javascript
// Guardar token automáticamente después del login
pm.test('Login successful', function () {
  var jsonData = pm.response.json();
  pm.environment.set('access_token', jsonData.access_token);
});
```

---

## 🧪 Tests de Integración

### Test: Validar que usuario inactivo no puede autenticarse

```javascript
const response = await fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'usuario_inactivo',
    password: 'password123',
  }),
});

expect(response.status).toBe(401);
```

### Test: Validar que se registra auditoría

```javascript
// 1. Hacer una acción
await fetch('http://localhost:3000/users/5', {
  method: 'DELETE',
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// 2. Verificar que se registró en auditoría
const auditResponse = await fetch(
  'http://localhost:3000/audit?resource=users&action=delete',
  {
    headers: { Authorization: `Bearer ${token}` },
  },
);

const auditData = await auditResponse.json();
expect(auditData.data.length).toBeGreaterThan(0);
expect(auditData.data[0].action).toBe('delete_users');
```

### Test: Validar permisos granulares

```javascript
// Usuario con rol "Chofer" no puede crear rutas
const response = await fetch('http://localhost:3000/routes', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${choferToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ name: 'Nueva Ruta' }),
});

expect(response.status).toBe(403);
expect(await response.json()).toMatchObject({
  message: 'Missing permission: routes:create',
});
```

---

## 📈 Consultas SQL Útiles

### Ver todos los permisos de un usuario

```sql
SELECT
  u.username,
  r.name AS role_name,
  g.resource,
  g.action
FROM users u
JOIN roles r ON u.role_id = r.id
JOIN role_grants rg ON r.id = rg.role_id
JOIN grants g ON rg.grant_id = g.id
WHERE u.id = 2;
```

### Top 10 usuarios más activos

```sql
SELECT
  u.username,
  u.first_name,
  u.last_name,
  COUNT(al.id) AS total_actions,
  MAX(al.created_at) AS last_action
FROM users u
LEFT JOIN audit_log al ON u.id = al.user_id
GROUP BY u.id
ORDER BY total_actions DESC
LIMIT 10;
```

### Acciones por tipo (último mes)

```sql
SELECT
  al.action,
  COUNT(*) AS count
FROM audit_log al
WHERE al.created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
GROUP BY al.action
ORDER BY count DESC;
```

### Usuarios sin actividad en 30 días

```sql
SELECT
  username,
  email,
  last_activity_at,
  DATEDIFF(NOW(), last_activity_at) AS days_inactive
FROM users
WHERE last_activity_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
  AND status = TRUE;
```

---

## 🚨 Troubleshooting

### Error: "Missing permission: X:Y"

**Causa:** El rol del usuario no tiene el permiso necesario.

**Solución:**

1. Verificar permisos del rol en la DB
2. Ejecutar seed de permisos: `npm run seed:permissions`
3. Asignar el permiso manualmente al rol

### Error: "Session expired due to inactivity"

**Causa:** Usuario inactivo por más de 30 minutos.

**Solución:** Volver a autenticarse con `/auth/login`

### Error: "User account is inactive"

**Causa:** El campo `status` del usuario está en `false`.

**Solución:** Activar usuario:

```sql
UPDATE users SET status = TRUE WHERE id = X;
```

### No se registran logs de auditoría

**Causa:** El `AuditInterceptor` no está registrado globalmente.

**Solución:** Verificar en `app.module.ts`:

```typescript
{
  provide: APP_INTERCEPTOR,
  useClass: AuditInterceptor,
}
```

---

**Última actualización:** Noviembre 6, 2025
