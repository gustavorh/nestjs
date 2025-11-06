import { SetMetadata } from '@nestjs/common';
import {
  REQUIRE_PERMISSION,
  PermissionMetadata,
} from '../guards/permissions.guard';

/**
 * Decorator to require a specific permission for accessing an endpoint.
 *
 * @param resource - The resource being accessed (e.g., 'users', 'orders', 'routes')
 * @param action - The action being performed (e.g., 'create', 'read', 'update', 'delete')
 *
 * @example
 * ```typescript
 * @UseGuards(JwtAuthGuard, PermissionsGuard)
 * @RequirePermission('users', 'delete')
 * @Delete(':id')
 * async deleteUser(@Param('id') id: number) {
 *   return this.usersService.delete(id);
 * }
 * ```
 */
export const RequirePermission = (resource: string, action: string) =>
  SetMetadata(REQUIRE_PERMISSION, { resource, action } as PermissionMetadata);
