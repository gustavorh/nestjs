import {
  mysqlTable,
  varchar,
  timestamp,
  int,
  boolean,
  index,
  uniqueIndex,
  primaryKey,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// OPERATORS TABLE
// ============================================================================
export const operators = mysqlTable(
  'operators',
  {
    id: int('id').primaryKey().autoincrement(),
    name: varchar('name', { length: 255 }).notNull(),
    rut: varchar('rut', { length: 12 }), // Format: 21.023.531-0
    super: boolean('super').notNull().default(false),
    expiration: timestamp('expiration'),
    status: boolean('status').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
    createdBy: int('created_by'),
    updatedBy: int('updated_by'),
  },
  (table) => ({
    rutIdx: uniqueIndex('rut_idx').on(table.rut),
    statusIdx: index('status_idx').on(table.status),
    superIdx: index('super_idx').on(table.super),
  }),
);

export const operatorsRelations = relations(operators, ({ many }) => ({
  users: many(users),
  roles: many(roles),
}));

// ============================================================================
// ROLES TABLE
// ============================================================================
export const roles = mysqlTable(
  'roles',
  {
    id: int('id').primaryKey().autoincrement(),
    name: varchar('name', { length: 100 }).notNull(),
    operatorId: int('operator_id')
      .notNull()
      .references(() => operators.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
    createdBy: int('created_by'),
    updatedBy: int('updated_by'),
  },
  (table) => ({
    operatorIdIdx: index('operator_id_idx').on(table.operatorId),
    operatorNameIdx: uniqueIndex('operator_name_idx').on(
      table.operatorId,
      table.name,
    ),
  }),
);

export const rolesRelations = relations(roles, ({ one, many }) => ({
  operator: one(operators, {
    fields: [roles.operatorId],
    references: [operators.id],
  }),
  users: many(users),
  roleGrants: many(roleGrants),
}));

// ============================================================================
// GRANTS TABLE (Universal - shared across all operators)
// ============================================================================
export const grants = mysqlTable(
  'grants',
  {
    id: int('id').primaryKey().autoincrement(),
    resource: varchar('resource', { length: 100 }).notNull(),
    action: varchar('action', { length: 50 }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
    createdBy: int('created_by'),
    updatedBy: int('updated_by'),
  },
  (table) => ({
    resourceActionIdx: uniqueIndex('resource_action_idx').on(
      table.resource,
      table.action,
    ),
  }),
);

export const grantsRelations = relations(grants, ({ many }) => ({
  roleGrants: many(roleGrants),
}));

// ============================================================================
// ROLE_GRANTS JUNCTION TABLE (Many-to-Many: Roles ↔ Grants)
// ============================================================================
export const roleGrants = mysqlTable(
  'role_grants',
  {
    roleId: int('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    grantId: int('grant_id')
      .notNull()
      .references(() => grants.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
    createdBy: int('created_by'),
    updatedBy: int('updated_by'),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.roleId, table.grantId] }),
    grantIdIdx: index('grant_id_idx').on(table.grantId),
  }),
);

export const roleGrantsRelations = relations(roleGrants, ({ one }) => ({
  role: one(roles, {
    fields: [roleGrants.roleId],
    references: [roles.id],
  }),
  grant: one(grants, {
    fields: [roleGrants.grantId],
    references: [grants.id],
  }),
}));

// ============================================================================
// USERS TABLE
// ============================================================================
export const users = mysqlTable(
  'users',
  {
    id: int('id').primaryKey().autoincrement(),
    username: varchar('username', { length: 50 }).notNull().unique(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    password: varchar('password', { length: 255 }).notNull(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    status: boolean('status').notNull().default(true),
    lastActivityAt: timestamp('last_activity_at'),
    operatorId: int('operator_id')
      .notNull()
      .references(() => operators.id, { onDelete: 'cascade' }),
    roleId: int('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
    createdBy: int('created_by'),
    updatedBy: int('updated_by'),
  },
  (table) => ({
    operatorIdIdx: index('user_operator_id_idx').on(table.operatorId),
    roleIdIdx: index('user_role_id_idx').on(table.roleId),
    statusIdx: index('user_status_idx').on(table.status),
  }),
);

export const usersRelations = relations(users, ({ one }) => ({
  operator: one(operators, {
    fields: [users.operatorId],
    references: [operators.id],
  }),
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
}));

// ============================================================================
// AUDIT_LOG TABLE
// ============================================================================
export const auditLog = mysqlTable(
  'audit_log',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: int('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    operatorId: int('operator_id')
      .notNull()
      .references(() => operators.id, { onDelete: 'cascade' }),
    action: varchar('action', { length: 100 }).notNull(),
    resource: varchar('resource', { length: 100 }),
    resourceId: int('resource_id'),
    details: varchar('details', { length: 1000 }),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: varchar('user_agent', { length: 500 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('audit_user_id_idx').on(table.userId),
    operatorIdIdx: index('audit_operator_id_idx').on(table.operatorId),
    actionIdx: index('audit_action_idx').on(table.action),
    resourceIdx: index('audit_resource_idx').on(table.resource),
    createdAtIdx: index('audit_created_at_idx').on(table.createdAt),
  }),
);

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  user: one(users, {
    fields: [auditLog.userId],
    references: [users.id],
  }),
  operator: one(operators, {
    fields: [auditLog.operatorId],
    references: [operators.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================
export type Operator = typeof operators.$inferSelect;
export type NewOperator = typeof operators.$inferInsert;

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;

export type Grant = typeof grants.$inferSelect;
export type NewGrant = typeof grants.$inferInsert;

export type RoleGrant = typeof roleGrants.$inferSelect;
export type NewRoleGrant = typeof roleGrants.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type AuditLog = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;
