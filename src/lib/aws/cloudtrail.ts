import { CloudTrailClient, LookupEventsCommand } from '@aws-sdk/client-cloudtrail';
import { CloudWatchLogsClient, PutLogEventsCommand, CreateLogStreamCommand, DescribeLogStreamsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { AuditLog } from '../../types';

const cloudTrailClient = new CloudTrailClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const cloudWatchClient = new CloudWatchLogsClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const LOG_GROUP_NAME = process.env.CLOUDWATCH_LOG_GROUP || '/patient-portal/audit';

export async function logAuditEvent(auditLog: AuditLog): Promise<void> {
  const logEvent = {
    timestamp: new Date(auditLog.timestamp).getTime(),
    message: JSON.stringify({
      ...auditLog,
      source: 'patient-portal',
      compliance: 'HIPAA',
    }),
  };

  const logStreamName = `audit-${new Date().toISOString().split('T')[0]}`;

  try {
    try {
      await cloudWatchClient.send(new CreateLogStreamCommand({
        logGroupName: LOG_GROUP_NAME,
        logStreamName,
      }));
    } catch {
      // Stream may already exist
    }

    const streams = await cloudWatchClient.send(new DescribeLogStreamsCommand({
      logGroupName: LOG_GROUP_NAME,
      logStreamNamePrefix: logStreamName,
    }));

    const sequenceToken = streams.logStreams?.[0]?.uploadSequenceToken;

    await cloudWatchClient.send(new PutLogEventsCommand({
      logGroupName: LOG_GROUP_NAME,
      logStreamName,
      logEvents: [logEvent],
      sequenceToken,
    }));
  } catch (error) {
    // Gracefully handle missing CloudWatch config - log to console instead
    console.log('[AUDIT]', JSON.stringify({ ...auditLog, source: 'patient-portal', compliance: 'HIPAA' }));
  }
}

export async function getAuditLogs(startTime: Date, endTime: Date): Promise<AuditLog[]> {
  try {
    const command = new LookupEventsCommand({
      StartTime: startTime,
      EndTime: endTime,
      MaxResults: 50,
    });

    const response = await cloudTrailClient.send(command);
    
    return (response.Events || []).map(event => ({
      userId: event.Username || 'unknown',
      action: event.EventName || 'unknown',
      resource: event.Resources?.[0]?.ResourceType || 'unknown',
      resourceId: event.Resources?.[0]?.ResourceName || 'unknown',
      timestamp: event.EventTime?.toISOString() || new Date().toISOString(),
      ipAddress: 'unknown',
      userAgent: 'unknown',
    }));
  } catch (error) {
    console.error('Failed to retrieve audit logs from CloudTrail:', error);
    return [];
  }
}
