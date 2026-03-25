import { UserRole } from '../types';

export interface Permission {
  resource: string;
  actions: string[];
}

const rolePermissions: Record<UserRole, Permission[]> = {
  PATIENT: [
    { resource: 'appointments', actions: ['read', 'create', 'cancel'] },
    { resource: 'medical_records', actions: ['read'] },
    { resource: 'messages', actions: ['read', 'create'] },
    { resource: 'profile', actions: ['read', 'update'] },
  ],
  DOCTOR: [
    { resource: 'appointments', actions: ['read', 'create', 'update', 'cancel', 'complete'] },
    { resource: 'medical_records', actions: ['read', 'create', 'update'] },
    { resource: 'messages', actions: ['read', 'create'] },
    { resource: 'patients', actions: ['read'] },
    { resource: 'profile', actions: ['read', 'update'] },
  ],
  ADMIN: [
    { resource: 'appointments', actions: ['read', 'create', 'update', 'cancel', 'complete', 'delete'] },
    { resource: 'medical_records', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'messages', actions: ['read', 'create', 'delete'] },
    { resource: 'patients', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'doctors', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'audit_logs', actions: ['read'] },
    { resource: 'profile', actions: ['read', 'update'] },
  ],
};

export function hasPermission(role: UserRole, resource: string, action: string): boolean {
  const permissions = rolePermissions[role] || [];
  const resourcePermission = permissions.find(p => p.resource === resource);
  
  if (!resourcePermission) return false;
  
  return resourcePermission.actions.includes(action);
}

export function requirePermission(role: UserRole, resource: string, action: string): void {
  if (!hasPermission(role, resource, action)) {
    throw new Error(`Access denied: ${role} cannot ${action} ${resource}`);
  }
}

export function getPermissionsForRole(role: UserRole): Permission[] {
  return rolePermissions[role] || [];
}
