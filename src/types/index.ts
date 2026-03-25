// User roles
export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN';

// User
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  cognitoSub: string;
}

// Appointment status
export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

// Appointment
export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  dateTime: string;
  status: AppointmentStatus;
  notes?: string;
  reminderSent: boolean;
}

// Medical Record
export interface MedicalRecord {
  id: string;
  patientId: string;
  type: string;
  date: string;
  provider: string;
  diagnosis?: string;
  medications?: string[];
  notes: string;
  encryptedData?: string;
}

// Message
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  subject: string;
  encryptedContent: string;
  decryptedContent?: string;
  timestamp: string;
  read: boolean;
  threadId: string;
}

// Audit Log
export interface AuditLog {
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
}
