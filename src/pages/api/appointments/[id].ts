import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../lib/auth';
import { hasPermission } from '../../../lib/rbac';
import { logAuditEvent } from '../../../lib/aws/cloudtrail';
import { Appointment } from '../../../types';

// In-memory reference to appointments (in production, use DB)
const appointments: Appointment[] = [];

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const user = req.user!;
  const { id } = req.query;

  if (req.method === 'PATCH') {
    const { status } = req.body;

    if (status === 'CANCELLED' && !hasPermission(user.role, 'appointments', 'cancel')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const appointmentIndex = appointments.findIndex(a => a.id === id);
    
    if (appointmentIndex === -1) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    appointments[appointmentIndex].status = status;

    await logAuditEvent({
      userId: user.id,
      action: `UPDATE_APPOINTMENT_${status}`,
      resource: 'appointments',
      resourceId: id as string,
      timestamp: new Date().toISOString(),
      ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    return res.status(200).json({ appointment: appointments[appointmentIndex] });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler);
