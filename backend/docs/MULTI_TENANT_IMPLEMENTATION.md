# Multi-Tenant Implementation - Update Summary

## Overview

This document describes the implementation changes made to support multi-tenant architecture with role-based access control (RBAC).

---

## Database Schema Changes

### New Tables Added

1. **operators** - Tenant/organization table
2. **roles** - Job function roles scoped to operators
3. **grants** - Universal permissions (resource + action)
4. **role_grants** - Junction table for many-to-many roles ↔ grants

### Modified Tables

**users** table now includes:

- `operatorId` (FK to operators) - Associates user with tenant
- `roleId` (FK to roles) - User's role within the operator
- `createdBy` - Audit field
- `updatedBy` - Audit field

All tables now have audit fields: `createdAt`, `updatedAt`, `createdBy`, `updatedBy`

---

## Code Changes

### 1. Database Schema (`src/database/schema.ts`)

**Added:**

- `operators` table definition with indexes
- `roles` table definition with indexes
- `grants` table definition with indexes
- `role_grants` junction table
- Drizzle ORM relations for all tables
- Type exports for all new entities

**Key Features:**

- Cascade deletes properly configured
- Unique constraints on RUT field
- Indexes on foreign keys and commonly queried fields
- Relations defined for easy querying

### 2. DTOs Updated

#### `src/auth/dto/auth.dto.ts`

**RegisterDto** - Added:

```typescript
operatorId: number;
roleId: number;
```

**AuthResponseDto** - Enhanced user object:

```typescript
user: {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  operatorId: number;     // NEW
  roleId: number;          // NEW
  operator?: {             // NEW
    id: number;
    name: string;
    super: boolean;
  };
  role?: {                 // NEW
    id: number;
    name: string;
  };
}
```

#### `src/users/dto/user.dto.ts`

**CreateUserDto** - Added:

```typescript
operatorId: number;
roleId: number;
```

**UpdateUserDto** - Added:

```typescript
roleId?: number;  // Allow role changes
```

### 3. Services Updated

#### `src/users/users.service.ts`

**Major Changes:**

- All query methods now include operator and role joins
- Added optional `operatorId` parameter for tenant isolation
- Validations added:
  - Operator exists and is active (on create)
  - Role belongs to operator (on create/update)
  - Prevent operator switching (on update)
- Methods return enriched user objects with operator and role data

**Key Methods:**

- `findAll(operatorId?)` - Filter by operator for tenant isolation
- `findById(id, operatorId?)` - Get user with tenant context
- `findByEmail(email)` - Includes operator/role data
- `findByUsername(username)` - Includes operator/role data
- `create(newUser)` - Validates operator and role
- `update(id, userData, operatorId?)` - Validates role ownership
- `delete(id, operatorId?)` - Tenant-isolated deletion

#### `src/auth/auth.service.ts`

**Major Changes:**

- `register()` now requires `operatorId` and `roleId`
- `validateUser()` checks operator status (inactive operators can't login)
- JWT payload enriched with:
  ```typescript
  {
    sub: user.id,
    username: user.username,
    email: user.email,
    operatorId: user.operatorId,    // NEW
    roleId: user.roleId,             // NEW
    isSuper: user.operator?.super    // NEW - For permission checks
  }
  ```
- Login response includes operator and role data

### 4. Strategies Updated

#### `src/auth/strategies/jwt.strategy.ts`

**JwtPayload Interface** - Enhanced:

```typescript
interface JwtPayload {
  sub: number;
  username: string;
  email: string;
  operatorId: number; // NEW
  roleId: number; // NEW
  isSuper: boolean; // NEW - Superadmin flag
}
```

**validate()** method now returns:

```typescript
{
  id: payload.sub,
  username: payload.username,
  email: payload.email,
  operatorId: payload.operatorId,
  roleId: payload.roleId,
  isSuper: payload.isSuper,
}
```

#### `src/auth/strategies/local.strategy.ts`

- Removed `User` type import (now uses inferred types)
- Returns enriched user object with operator/role data

### 5. Controller Updated

#### `src/users/users.controller.ts`

**All endpoints now protected with `@UseGuards(JwtAuthGuard)`**

**Tenant Isolation Logic:**

```typescript
// Non-superadmin users are restricted to their operator
const operatorId = req.user.isSuper ? undefined : req.user.operatorId;
```

**Changes by Endpoint:**

- `GET /users` - Filters by operator (unless superadmin)
- `GET /users/:id` - Validates user belongs to operator (unless superadmin)
- `POST /users` - Validates creating user in correct operator
- `PUT /users/:id` - Validates updating user in correct operator
- `DELETE /users/:id` - Validates deleting user in correct operator

---

## Multi-Tenant Architecture

### Tenant Isolation Strategy

1. **Data Segregation**: All user data queries filter by `operatorId`
2. **Superadmin Bypass**: Operators with `super = true` can access all data
3. **Role Scoping**: Roles are scoped to operators (can't be shared)
4. **Permission Model**: Users → Roles → Grants (granular permissions)

### Permission Flow

```
User Request
    ↓
JWT Token (contains operatorId, roleId, isSuper)
    ↓
Controller/Guard
    ↓
Check if isSuper = true
    ↓ (if false)
Filter by operatorId
    ↓
Service Layer
    ↓
Database Query (with operator filter)
```

### Superadmin Privileges

Operators with `super = true`:

- Can access users across all operators
- Can create users for any operator
- Bypass tenant isolation filters
- Should have full application permissions

---

## Migration Notes

### Breaking Changes

⚠️ **IMPORTANT**: Existing users in the database need to be assigned:

1. An `operatorId`
2. A `roleId`

### Steps to Migrate Existing Data

```sql
-- 1. Create a default operator
INSERT INTO operators (name, super, status, created_at, updated_at)
VALUES ('Default Operator', true, true, NOW(), NOW());

-- 2. Create a default admin role
INSERT INTO roles (name, operator_id, created_at, updated_at)
VALUES ('Admin', LAST_INSERT_ID(), NOW(), NOW());

-- 3. Update existing users
UPDATE users
SET
  operator_id = (SELECT id FROM operators LIMIT 1),
  role_id = (SELECT id FROM roles LIMIT 1),
  updated_at = NOW()
WHERE operator_id IS NULL;
```

---

## API Usage Examples

### Register a New User

```bash
POST /auth/register
Content-Type: application/json

{
  "username": "john.doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "operatorId": 1,    # NEW - Required
  "roleId": 2         # NEW - Required
}
```

### Login Response (Enhanced)

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john.doe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "operatorId": 1,
    "roleId": 2,
    "operator": {
      "id": 1,
      "name": "ACME Corp",
      "super": false
    },
    "role": {
      "id": 2,
      "name": "Manager"
    }
  }
}
```

### JWT Payload (Decoded)

```json
{
  "sub": 1,
  "username": "john.doe",
  "email": "john@example.com",
  "operatorId": 1,
  "roleId": 2,
  "isSuper": false,
  "iat": 1699200000,
  "exp": 1699286400
}
```

---

## Next Steps

### Recommended Implementations

1. **Permission Guard** - Create a guard to check grants

   ```typescript
   @UseGuards(JwtAuthGuard, PermissionsGuard)
   @RequirePermission('users', 'delete')
   async delete() { ... }
   ```

2. **Operators Service** - CRUD operations for operators
3. **Roles Service** - CRUD operations for roles
4. **Grants Service** - CRUD operations for grants
5. **Seed Data** - Create default grants (users:create, users:read, etc.)
6. **Admin Panel** - UI to manage operators, roles, and grants

### Security Considerations

1. **Rate Limiting** - Implement per-operator rate limits
2. **Audit Logging** - Track all operations with operator context
3. **Data Export** - Add operator context to all exports
4. **API Keys** - Consider operator-scoped API keys
5. **Webhooks** - Operator-scoped webhook events

---

## Testing

### Test Scenarios

1. ✅ User registration with operator and role
2. ✅ Login with inactive operator (should fail)
3. ✅ Superadmin accessing other operators' data
4. ✅ Non-superadmin restricted to own operator
5. ✅ Creating user for wrong operator (should fail)
6. ✅ Updating user's role (must belong to same operator)
7. ✅ Preventing operator switching

### Sample Test Data

```typescript
// Create test operator
const operator = await db.insert(operators).values({
  name: 'Test Corp',
  super: false,
  status: true,
});

// Create test role
const role = await db.insert(roles).values({
  name: 'Admin',
  operatorId: operator.id,
});

// Create test grants
await db.insert(grants).values([
  { resource: 'users', action: 'create' },
  { resource: 'users', action: 'read' },
  { resource: 'users', action: 'update' },
  { resource: 'users', action: 'delete' },
]);

// Assign grants to role
await db.insert(roleGrants).values([
  { roleId: role.id, grantId: 1 },
  { roleId: role.id, grantId: 2 },
]);
```

---

## Related Documentation

- [Multi-Tenant Schema](./MULTI_TENANT_SCHEMA.md) - Detailed schema documentation
- [Authentication Flow](./AUTHENTICATION.md) - Authentication system
- [Drizzle ORM](./DRIZZLE_ORM.md) - Database ORM usage

---

## Summary

✅ **Completed:**

- Multi-tenant database schema with 4 new tables
- Audit fields on all tables
- Updated DTOs for operator and role data
- Enhanced services with tenant isolation
- Updated controllers with superadmin logic
- JWT tokens enriched with tenant context
- Build verification passed

⚠️ **Required:**

- Migrate existing users to have operator and role
- Create permission checking guards
- Implement operators/roles/grants services
- Add seed data for common grants

🎯 **Ready for:**

- User registration with tenant context
- Login with operator validation
- Tenant-isolated data access
- Superadmin cross-tenant access
