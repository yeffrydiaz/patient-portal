import { hasPermission, requirePermission, getPermissionsForRole } from '../lib/rbac';

describe('RBAC - Role-Based Access Control', () => {
  describe('hasPermission', () => {
    it('should allow patient to read appointments', () => {
      expect(hasPermission('PATIENT', 'appointments', 'read')).toBe(true);
    });

    it('should allow patient to create appointments', () => {
      expect(hasPermission('PATIENT', 'appointments', 'create')).toBe(true);
    });

    it('should allow patient to cancel appointments', () => {
      expect(hasPermission('PATIENT', 'appointments', 'cancel')).toBe(true);
    });

    it('should NOT allow patient to delete appointments', () => {
      expect(hasPermission('PATIENT', 'appointments', 'delete')).toBe(false);
    });

    it('should NOT allow patient to access audit logs', () => {
      expect(hasPermission('PATIENT', 'audit_logs', 'read')).toBe(false);
    });

    it('should allow doctor to create medical records', () => {
      expect(hasPermission('DOCTOR', 'medical_records', 'create')).toBe(true);
    });

    it('should NOT allow doctor to access audit logs', () => {
      expect(hasPermission('DOCTOR', 'audit_logs', 'read')).toBe(false);
    });

    it('should allow admin to access audit logs', () => {
      expect(hasPermission('ADMIN', 'audit_logs', 'read')).toBe(true);
    });

    it('should allow admin to delete appointments', () => {
      expect(hasPermission('ADMIN', 'appointments', 'delete')).toBe(true);
    });

    it('should return false for unknown role', () => {
      expect(hasPermission('UNKNOWN' as any, 'appointments', 'read')).toBe(false);
    });

    it('should return false for unknown resource', () => {
      expect(hasPermission('PATIENT', 'unknown_resource', 'read')).toBe(false);
    });
  });

  describe('requirePermission', () => {
    it('should not throw when permission is granted', () => {
      expect(() => requirePermission('PATIENT', 'appointments', 'read')).not.toThrow();
    });

    it('should throw when permission is denied', () => {
      expect(() => requirePermission('PATIENT', 'audit_logs', 'read')).toThrow('Access denied');
    });

    it('should throw with descriptive error message', () => {
      expect(() => requirePermission('DOCTOR', 'audit_logs', 'read')).toThrow(
        'Access denied: DOCTOR cannot read audit_logs'
      );
    });
  });

  describe('getPermissionsForRole', () => {
    it('should return permissions for PATIENT', () => {
      const permissions = getPermissionsForRole('PATIENT');
      expect(permissions.length).toBeGreaterThan(0);
      expect(permissions.some(p => p.resource === 'appointments')).toBe(true);
    });

    it('should return more permissions for ADMIN than PATIENT', () => {
      const patientPerms = getPermissionsForRole('PATIENT');
      const adminPerms = getPermissionsForRole('ADMIN');
      expect(adminPerms.length).toBeGreaterThan(patientPerms.length);
    });

    it('should return empty array for unknown role', () => {
      const permissions = getPermissionsForRole('UNKNOWN' as any);
      expect(permissions).toEqual([]);
    });
  });
});
