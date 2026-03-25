import { NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';
import { withAuth, AuthenticatedRequest } from '../../../lib/auth';
import { hasPermission } from '../../../lib/rbac';
import { logAuditEvent } from '../../../lib/aws/cloudtrail';
import { sendAppointmentReminder } from '../../../lib/aws/sns';
import { Appointment } from '../../../types';

// In-memory store for demo (replace with DynamoDB/RDS in production)
const appointments: Appointment[] = [];

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const user = req.user!;

  if (req.method === 'GET') {
    if (!hasPermission(user.role, 'appointments', 'read')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const userAppointments = user.role === 'PATIENT'
      ? appointments.filter(a => a.patientId === user.id)
      : appointments;

    await logAuditEvent({
      userId: user.id,
      action: 'READ_APPOINTMENTS',
      resource: 'appointments',
      resourceId: 'list',
      timestamp: new Date().toISOString(),
      ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    return res.status(200).json({ appointments: userAppointments });
  }

  if (req.method === 'POST') {
    if (!hasPermission(user.role, 'appointments', 'create')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { doctorId, dateTime, notes, patientPhone } = req.body;

    if (!doctorId || !dateTime) {
      return res.status(400).json({ error: 'Doctor ID and date/time are required' });
    }

    const appointment: Appointment = {
      id: uuidv4(),
      patientId: user.id,
      doctorId,
      dateTime,
      status: 'SCHEDULED',
      notes,
      reminderSent: false,
    };

    appointments.push(appointment);

    if (patientPhone) {
      try {
        await sendAppointmentReminder(
          patientPhone,
          user.name,
          'Your Doctor',
          new Date(dateTime).toLocaleString()
        );
        appointment.reminderSent = true;
      } catch (error) {
        console.error('Failed to send SMS reminder:', error);
      }
    }

    await logAuditEvent({
      userId: user.id,
      action: 'CREATE_APPOINTMENT',
      resource: 'appointments',
      resourceId: appointment.id,
      timestamp: new Date().toISOString(),
      ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    return res.status(201).json({ appointment });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler);
