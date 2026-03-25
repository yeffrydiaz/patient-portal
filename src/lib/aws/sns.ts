import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const snsClient = new SNSClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

export async function sendSMSReminder(phoneNumber: string, message: string): Promise<void> {
  const command = new PublishCommand({
    PhoneNumber: phoneNumber,
    Message: message,
    MessageAttributes: {
      'AWS.SNS.SMS.SMSType': {
        DataType: 'String',
        StringValue: 'Transactional',
      },
      'AWS.SNS.SMS.SenderID': {
        DataType: 'String',
        StringValue: 'CLINIC',
      },
    },
  });

  await snsClient.send(command);
}

export async function sendAppointmentReminder(
  phoneNumber: string,
  patientName: string,
  doctorName: string,
  appointmentDateTime: string
): Promise<void> {
  const message = `Hello ${patientName}, this is a reminder for your appointment with Dr. ${doctorName} on ${appointmentDateTime}. Reply CANCEL to cancel. Reply CONFIRM to confirm.`;
  
  await sendSMSReminder(phoneNumber, message);
}
