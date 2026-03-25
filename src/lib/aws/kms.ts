import { KMSClient, EncryptCommand, DecryptCommand, GenerateDataKeyCommand } from '@aws-sdk/client-kms';

const kmsClient = new KMSClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const KEY_ID = process.env.KMS_KEY_ID || '';

export async function encryptData(plaintext: string): Promise<string> {
  const command = new EncryptCommand({
    KeyId: KEY_ID,
    Plaintext: Buffer.from(plaintext, 'utf-8'),
  });

  const response = await kmsClient.send(command);
  
  if (!response.CiphertextBlob) {
    throw new Error('Encryption failed');
  }

  return Buffer.from(response.CiphertextBlob).toString('base64');
}

export async function decryptData(ciphertext: string): Promise<string> {
  const command = new DecryptCommand({
    CiphertextBlob: Buffer.from(ciphertext, 'base64'),
    KeyId: KEY_ID,
  });

  const response = await kmsClient.send(command);
  
  if (!response.Plaintext) {
    throw new Error('Decryption failed');
  }

  return Buffer.from(response.Plaintext).toString('utf-8');
}

export async function generateDataKey(): Promise<{ plaintext: string; encrypted: string }> {
  const command = new GenerateDataKeyCommand({
    KeyId: KEY_ID,
    KeySpec: 'AES_256',
  });

  const response = await kmsClient.send(command);

  return {
    plaintext: Buffer.from(response.Plaintext!).toString('base64'),
    encrypted: Buffer.from(response.CiphertextBlob!).toString('base64'),
  };
}
