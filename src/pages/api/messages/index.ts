import { NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';
import { withAuth, AuthenticatedRequest } from '../../../lib/auth';
import { hasPermission } from '../../../lib/rbac';
import { encryptData, decryptData } from '../../../lib/aws/kms';
import { logAuditEvent } from '../../../lib/aws/cloudtrail';
import { Message } from '../../../types';

// In-memory store for demo
const messages: Message[] = [];

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const user = req.user!;

  if (req.method === 'GET') {
    if (!hasPermission(user.role, 'messages', 'read')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const userMessages = messages.filter(
      m => m.senderId === user.id || m.receiverId === user.id
    );

    const decryptedMessages = await Promise.all(
      userMessages.map(async (msg) => {
        try {
          const decryptedContent = await decryptData(msg.encryptedContent);
          return { ...msg, decryptedContent };
        } catch {
          return { ...msg, decryptedContent: '[Encrypted]' };
        }
      })
    );

    await logAuditEvent({
      userId: user.id,
      action: 'READ_MESSAGES',
      resource: 'messages',
      resourceId: 'list',
      timestamp: new Date().toISOString(),
      ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    return res.status(200).json({ messages: decryptedMessages });
  }

  if (req.method === 'POST') {
    if (!hasPermission(user.role, 'messages', 'create')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { receiverId, subject, content, threadId } = req.body;

    if (!receiverId || !subject || !content) {
      return res.status(400).json({ error: 'Receiver, subject, and content are required' });
    }

    const encryptedContent = await encryptData(content);

    const message: Message = {
      id: uuidv4(),
      senderId: user.id,
      receiverId,
      subject,
      encryptedContent,
      timestamp: new Date().toISOString(),
      read: false,
      threadId: threadId || uuidv4(),
    };

    messages.push(message);

    await logAuditEvent({
      userId: user.id,
      action: 'SEND_MESSAGE',
      resource: 'messages',
      resourceId: message.id,
      timestamp: new Date().toISOString(),
      ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    return res.status(201).json({ message: { ...message, decryptedContent: content } });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler);
