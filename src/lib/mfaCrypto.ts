// src/lib/mfaCrypto.ts
import crypto from 'crypto';

const KEY_B64 = process.env.APP_ENCRYPTION_KEY || '';
if (!KEY_B64) throw new Error('APP_ENCRYPTION_KEY is required');
const KEY = Buffer.from(KEY_B64, 'base64');
if (KEY.length < 32) throw new Error('APP_ENCRYPTION_KEY must decode to 32+ bytes (base64)');

export function encryptSecret(plaintext: string): Buffer {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]);
}

export function decryptSecret(blob: Buffer): string {
  const iv = blob.slice(0, 12);
  const tag = blob.slice(12, 28);
  const ciphertext = blob.slice(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(tag);
  const out = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return out.toString('utf8');
}