import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateUser } from '../../../lib/aws/cognito';
import { logAuditEvent } from '../../../lib/aws/cloudtrail';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const tokens = await authenticateUser(email, password);
    
    await logAuditEvent({
      userId: email,
      action: 'LOGIN',
      resource: 'auth',
      resourceId: email,
      timestamp: new Date().toISOString(),
      ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    return res.status(200).json({ tokens });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(401).json({ error: 'Invalid credentials' });
  }
}
