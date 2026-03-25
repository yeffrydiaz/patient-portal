import { UserRole, AppointmentStatus } from '../types';

describe('Type Definitions', () => {
  describe('UserRole', () => {
    const validRoles: UserRole[] = ['PATIENT', 'DOCTOR', 'ADMIN'];
    
    it('should have correct role values', () => {
      expect(validRoles).toContain('PATIENT');
      expect(validRoles).toContain('DOCTOR');
      expect(validRoles).toContain('ADMIN');
    });
  });

  describe('AppointmentStatus', () => {
    const validStatuses: AppointmentStatus[] = ['SCHEDULED', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
    
    it('should have correct status values', () => {
      expect(validStatuses).toContain('SCHEDULED');
      expect(validStatuses).toContain('CONFIRMED');
      expect(validStatuses).toContain('CANCELLED');
      expect(validStatuses).toContain('COMPLETED');
    });
  });
});
