# Multi-Tenant Database Schema

## Overview

This document describes the multi-tenant database schema implementation that supports multiple operators (tenants) with granular role-based access control (RBAC).

## Schema Architecture

### Entity Relationship Diagram

```
┌─────────────┐
│  Operators  │
│  (Tenants)  │
└──────┬──────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌──────────┐      ┌──────────┐
│  Roles   │      │  Users   │
└────┬─────┘      └────┬─────┘
     │                 │
     │                 │ (roleId FK)
     │                 │
     ▼                 ▼
┌────────────┐    ┌──────────┐
│ role_grants│◄───┤  Roles   │
└─────┬──────┘    └──────────┘
      │
      │
      ▼
┌──────────┐
│  Grants  │
│(Universal)│
└──────────┘
```

## Tables

### 1. **operators** (Tenants)

The top-level entity representing a company or organization.

| Field      | Type         | Description                                    |
| ---------- | ------------ | ---------------------------------------------- |
| id         | INT          | Primary key                                    |
| name       | VARCHAR(255) | Operator/company name                          |
| rut        | VARCHAR(12)  | Chilean tax ID (format: 21.023.531-0) - UNIQUE |
| super      | BOOLEAN      | Superadmin flag - full application access      |
| expiration | TIMESTAMP    | Optional expiration date                       |
| status     | BOOLEAN      | Active/Inactive status                         |
| createdAt  | TIMESTAMP    | Record creation timestamp                      |
| updatedAt  | TIMESTAMP    | Record update timestamp                        |
| createdBy  | INT          | User ID who created the record                 |
| updatedBy  | INT          | User ID who last updated the record            |

**Indexes:**

- `rut_idx` (UNIQUE) - Fast lookup by Chilean tax ID
- `status_idx` - Filter active/inactive operators
- `super_idx` - Quick identification of superadmin operators

**Relationships:**

- One-to-Many with `roles`
- One-to-Many with `users`

---

### 2. **roles**

Roles define job functions within an operator. Each operator has its own set of roles.

| Field      | Type         | Description                               |
| ---------- | ------------ | ----------------------------------------- |
| id         | INT          | Primary key                               |
| name       | VARCHAR(100) | Role name (e.g., "Admin", "Manager")      |
| operatorId | INT          | Foreign key to operators (CASCADE DELETE) |
| createdAt  | TIMESTAMP    | Record creation timestamp                 |
| updatedAt  | TIMESTAMP    | Record update timestamp                   |
| createdBy  | INT          | User ID who created the record            |
| updatedBy  | INT          | User ID who last updated the record       |

**Indexes:**

- `operator_id_idx` - Fast filtering by operator
- `operator_name_idx` (UNIQUE on operatorId + name) - Prevent duplicate role names per operator

**Relationships:**

- Many-to-One with `operators`
- One-to-Many with `users`
- Many-to-Many with `grants` (via `role_grants`)

---

### 3. **grants** (Universal Permissions)

Grants define atomic permissions that can be assigned to roles. These are **universal** across all operators.

| Field     | Type         | Description                                    |
| --------- | ------------ | ---------------------------------------------- |
| id        | INT          | Primary key                                    |
| resource  | VARCHAR(100) | Resource name (e.g., "users", "reports")       |
| action    | VARCHAR(50)  | Action type (e.g., "create", "read", "update") |
| createdAt | TIMESTAMP    | Record creation timestamp                      |
| updatedAt | TIMESTAMP    | Record update timestamp                        |
| createdBy | INT          | User ID who created the record                 |
| updatedBy | INT          | User ID who last updated the record            |

**Indexes:**

- `resource_action_idx` (UNIQUE on resource + action) - Prevent duplicate permissions

**Relationships:**

- Many-to-Many with `roles` (via `role_grants`)

**Example Grants:**

```typescript
{ resource: "users", action: "create" }
{ resource: "users", action: "read" }
{ resource: "users", action: "update" }
{ resource: "users", action: "delete" }
{ resource: "reports", action: "read" }
{ resource: "reports", action: "export" }
{ resource: "settings", action: "update" }
```

---

### 4. **role_grants** (Junction Table)

Maps which grants are assigned to which roles. This enables flexible permission assignment.

| Field     | Type      | Description                            |
| --------- | --------- | -------------------------------------- |
| roleId    | INT       | Foreign key to roles (CASCADE DELETE)  |
| grantId   | INT       | Foreign key to grants (CASCADE DELETE) |
| createdAt | TIMESTAMP | Record creation timestamp              |
| updatedAt | TIMESTAMP | Record update timestamp                |
| createdBy | INT       | User ID who created the record         |
| updatedBy | INT       | User ID who last updated the record    |

**Primary Key:** Composite (roleId, grantId)

**Indexes:**

- `grant_id_idx` - Optimize reverse lookups (which roles have a specific grant)

**Relationships:**

- Many-to-One with `roles`
- Many-to-One with `grants`

---

### 5. **users**

Application users belonging to an operator with an assigned role.

| Field      | Type         | Description                               |
| ---------- | ------------ | ----------------------------------------- |
| id         | INT          | Primary key                               |
| username   | VARCHAR(50)  | Unique username                           |
| email      | VARCHAR(255) | Unique email address                      |
| password   | VARCHAR(255) | Hashed password                           |
| firstName  | VARCHAR(100) | User's first name                         |
| lastName   | VARCHAR(100) | User's last name                          |
| operatorId | INT          | Foreign key to operators (CASCADE DELETE) |
| roleId     | INT          | Foreign key to roles (RESTRICT DELETE)    |
| createdAt  | TIMESTAMP    | Record creation timestamp                 |
| updatedAt  | TIMESTAMP    | Record update timestamp                   |
| createdBy  | INT          | User ID who created the record            |
| updatedBy  | INT          | User ID who last updated the record       |

**Indexes:**

- `user_operator_id_idx` - Fast filtering by operator
- `user_role_id_idx` - Fast filtering by role

**Relationships:**

- Many-to-One with `operators`
- Many-to-One with `roles`

---

## Multi-Tenant Architecture

### Tenant Isolation

1. **Operator Level**: Each operator is completely isolated
2. **Role Scoping**: Roles are scoped to operators (can't be shared across operators)
3. **User Scoping**: Users belong to one operator and have one role
4. **Grant Universality**: Grants are universal - all operators can use the same permission definitions

### Permission Flow

```
User → Role → Role_Grants → Grants
  ↓
Operator (Tenant Context)
```

### Superadmin Operators

Operators with `super = true` have special privileges:

- Full access to all resources and actions
- Can manage other operators
- Bypass role/grant checks in the application logic

### Data Access Rules

1. **Standard Users**: Can only access data within their operator
2. **Superadmin Operators**: Can access data across all operators
3. **Role Enforcement**: User permissions are determined by their role's grants
4. **Cascade Deletes**:
   - Deleting an operator removes all its roles and users
   - Deleting a role removes all its grant associations (but not the grants themselves)

---

## Implementation Guidelines

### Creating a New Tenant

```typescript
// 1. Create operator
const operator = await db.insert(operators).values({
  name: 'ACME Corp',
  rut: '12.345.678-9',
  super: false,
  status: true,
  createdBy: adminUserId,
  updatedBy: adminUserId,
});

// 2. Create roles for the operator
const adminRole = await db.insert(roles).values({
  name: 'Admin',
  operatorId: operator.id,
  createdBy: adminUserId,
  updatedBy: adminUserId,
});

// 3. Assign grants to role
await db.insert(roleGrants).values([
  { roleId: adminRole.id, grantId: 1 }, // users:create
  { roleId: adminRole.id, grantId: 2 }, // users:read
  // ... more grants
]);

// 4. Create users
const user = await db.insert(users).values({
  username: 'john.doe',
  email: 'john@acme.com',
  password: hashedPassword,
  firstName: 'John',
  lastName: 'Doe',
  operatorId: operator.id,
  roleId: adminRole.id,
  createdBy: adminUserId,
  updatedBy: adminUserId,
});
```

### Checking Permissions

```typescript
// Middleware/Guard to check if user has permission
async function hasPermission(
  userId: number,
  resource: string,
  action: string,
): Promise<boolean> {
  // 1. Get user with operator and role
  const user = await db
    .select()
    .from(users)
    .leftJoin(operators, eq(users.operatorId, operators.id))
    .leftJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, userId))
    .limit(1);

  // 2. Check if operator is superadmin
  if (user.operators.super) {
    return true;
  }

  // 3. Check role grants
  const grant = await db
    .select()
    .from(roleGrants)
    .leftJoin(grants, eq(roleGrants.grantId, grants.id))
    .where(
      and(
        eq(roleGrants.roleId, user.roles.id),
        eq(grants.resource, resource),
        eq(grants.action, action),
      ),
    )
    .limit(1);

  return !!grant;
}
```

### Querying with Tenant Context

```typescript
// Always filter by operatorId for tenant isolation
const userReports = await db
  .select()
  .from(reports)
  .where(
    and(
      eq(reports.operatorId, currentUser.operatorId),
      eq(reports.userId, currentUser.id),
    ),
  );
```

---

## Best Practices

1. **Always Include Tenant Context**: Every query should filter by `operatorId` (except for superadmins)
2. **Validate Operator Ownership**: Before any operation, verify the resource belongs to the user's operator
3. **Centralized Permission Checking**: Create a guard/middleware for permission checks
4. **Audit Trail**: Use `createdBy` and `updatedBy` fields consistently
5. **Soft Deletes Not Needed**: We're using hard deletes with proper cascade rules
6. **Index Performance**: Queries filtering by `operatorId` are optimized with indexes

---

## Migration Notes

### Breaking Changes

The schema now requires:

- `operatorId` on users (NOT NULL)
- `roleId` on users (NOT NULL)

### Required Updates

1. **Authentication Service**: Update registration to require operator and role
2. **User Service**: Update queries to include operator context
3. **Guards**: Implement permission checking guards
4. **DTOs**: Update DTOs to include operator and role information

---

## Future Considerations

1. **Audit Logging**: Consider a separate audit table for tracking all changes
2. **Role Hierarchy**: Could extend to support role inheritance
3. **Dynamic Grants**: Could add a UI to manage grants dynamically
4. **Operator Settings**: Could add an `operator_settings` table for tenant-specific configuration
5. **Usage Limits**: Could add resource quotas per operator

---

## Related Documentation

- [Authentication Flow](./AUTHENTICATION.md)
- [Drizzle ORM Usage](./DRIZZLE_ORM.md)
- [API Implementation](./IMPLEMENTATION_SUMMARY.md)
