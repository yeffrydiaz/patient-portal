import { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromToken } from './aws/cognito';
import { logAuditEvent } from './aws/cloudtrail';
import { User, UserRole } from '../types';

export interface AuthenticatedRequest extends NextApiRequest {
  user?: User;
}

export async function getAuthenticatedUser(req: NextApiRequest): Promise<User | null> {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const cognitoUser = await getUserFromToken(token);
    
    return {
      id: cognitoUser.sub,
      email: cognitoUser.email,
      name: cognitoUser.name,
      role: cognitoUser.role as UserRole,
      cognitoSub: cognitoUser.sub,
    };
  } catch {
    return null;
  }
}

export function withAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>,
  requiredRole?: UserRole
) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (requiredRole && user.role !== requiredRole) {
      try {
        await logAuditEvent({
          userId: user.id,
          action: 'UNAUTHORIZED_ACCESS',
          resource: req.url || 'unknown',
          resourceId: 'unknown',
          timestamp: new Date().toISOString(),
          ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
        });
      } catch {
        // Audit logging failure should not block the response
      }
      return res.status(403).json({ error: 'Forbidden' });
    }

    req.user = user;
    await handler(req, res);
  };
}
