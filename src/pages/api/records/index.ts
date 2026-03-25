import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../lib/auth';
import { hasPermission } from '../../../lib/rbac';
import { logAuditEvent } from '../../../lib/aws/cloudtrail';
import { MedicalRecord } from '../../../types';
import { v4 as uuidv4 } from 'uuid';

// In-memory store for demo
const medicalRecords: MedicalRecord[] = [
  {
    id: 'rec-001',
    patientId: 'patient-001',
    type: 'Lab Results',
    date: '2026-03-01',
    provider: 'Dr. Smith',
    diagnosis: 'Routine checkup - Normal',
    medications: ['Vitamin D 1000IU', 'Omega-3'],
    notes: 'All lab results within normal range. Follow up in 6 months.',
  },
  {
    id: 'rec-002',
    patientId: 'patient-001',
    type: 'Radiology',
    date: '2026-02-15',
    provider: 'Dr. Johnson',
    diagnosis: 'Chest X-Ray - Clear',
    notes: 'No abnormalities detected.',
  },
];

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const user = req.user!;

  if (req.method === 'GET') {
    if (!hasPermission(user.role, 'medical_records', 'read')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const patientId = req.query.patientId as string || user.id;
    
    if (user.role === 'PATIENT' && patientId !== user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const records = medicalRecords.filter(r => r.patientId === patientId);

    await logAuditEvent({
      userId: user.id,
      action: 'READ_MEDICAL_RECORDS',
      resource: 'medical_records',
      resourceId: patientId,
      timestamp: new Date().toISOString(),
      ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    return res.status(200).json({ records });
  }

  if (req.method === 'POST') {
    if (!hasPermission(user.role, 'medical_records', 'create')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { patientId, type, date, diagnosis, medications, notes } = req.body;

    if (!patientId || !type || !date || !notes) {
      return res.status(400).json({ error: 'Patient ID, type, date, and notes are required' });
    }

    const record: MedicalRecord = {
      id: uuidv4(),
      patientId,
      type,
      date,
      provider: user.name,
      diagnosis,
      medications,
      notes,
    };

    medicalRecords.push(record);

    await logAuditEvent({
      userId: user.id,
      action: 'CREATE_MEDICAL_RECORD',
      resource: 'medical_records',
      resourceId: record.id,
      timestamp: new Date().toISOString(),
      ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    return res.status(201).json({ record });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler);
