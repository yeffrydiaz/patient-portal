import { NextApiRequest, NextApiResponse } from 'next';
import { registerUser } from '../../../lib/aws/cognito';
import { logAuditEvent } from '../../../lib/aws/cloudtrail';
import { UserRole } from '../../../types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, name, role = 'PATIENT' } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }

  try {
    const userId = await registerUser(email, password, name, role as UserRole);
    
    await logAuditEvent({
      userId,
      action: 'REGISTER',
      resource: 'auth',
      resourceId: userId,
      timestamp: new Date().toISOString(),
      ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    return res.status(201).json({ userId, message: 'Registration successful. Please check your email to verify your account.' });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(400).json({ error: 'Registration failed' });
  }
}
