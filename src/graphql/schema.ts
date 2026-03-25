export const typeDefs = `
  type User {
    id: ID!
    email: String!
    name: String!
    role: UserRole!
  }

  enum UserRole {
    PATIENT
    DOCTOR
    ADMIN
  }

  enum AppointmentStatus {
    SCHEDULED
    CONFIRMED
    CANCELLED
    COMPLETED
  }

  type Appointment {
    id: ID!
    patientId: ID!
    doctorId: ID!
    dateTime: String!
    status: AppointmentStatus!
    notes: String
    reminderSent: Boolean!
  }

  type MedicalRecord {
    id: ID!
    patientId: ID!
    type: String!
    date: String!
    provider: String!
    diagnosis: String
    medications: [String!]
    notes: String!
  }

  type Message {
    id: ID!
    senderId: ID!
    receiverId: ID!
    subject: String!
    content: String!
    timestamp: String!
    read: Boolean!
    threadId: ID!
  }

  type Query {
    appointments(patientId: ID): [Appointment!]!
    appointment(id: ID!): Appointment
    medicalRecords(patientId: ID!): [MedicalRecord!]!
    medicalRecord(id: ID!): MedicalRecord
    messages(userId: ID!): [Message!]!
    message(id: ID!): Message
  }

  type Mutation {
    bookAppointment(patientId: ID!, doctorId: ID!, dateTime: String!, notes: String): Appointment!
    cancelAppointment(id: ID!): Appointment!
    confirmAppointment(id: ID!): Appointment!
    sendMessage(receiverId: ID!, subject: String!, content: String!): Message!
    markMessageRead(id: ID!): Message!
  }
`;
