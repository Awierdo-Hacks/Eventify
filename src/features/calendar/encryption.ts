import 'server-only';
import crypto from 'node:crypto';
import { env } from '@/lib/env';

/**
 * Encrypts calendar OAuth tokens at rest. The format (`ivHex:cipherHex`,
 * AES-256-CBC) is the same as v1, so tokens stored by v1 stay readable.
 */
const ALGORITHM = 'aes-256-cbc';

/** v1 used this derived key whenever no key was configured. Kept for reading old data only. */
const legacyKey = () => crypto.scryptSync('eventify-calendar-dev-key', 'salt', 32);

function configuredKey(): Buffer | null {
  const key = env.calendarEncryptionKey;
  if (!key) return null;
  const buffer = Buffer.from(key, 'hex');
  if (buffer.length !== 32) throw new Error('CALENDAR_ENCRYPTION_KEY must be 64 hex characters');
  return buffer;
}

export function canEncryptTokens(): boolean {
  return Boolean(env.calendarEncryptionKey) || !env.isProduction;
}

export function encryptToken(text: string): string {
  const key = configuredKey() ?? (env.isProduction ? null : legacyKey());
  if (!key) throw new Error('CALENDAR_ENCRYPTION_KEY is not set');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  return `${iv.toString('hex')}:${Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]).toString('hex')}`;
}

export function decryptToken(encrypted: string): string {
  const [ivHex, dataHex] = encrypted.split(':');
  if (!ivHex || !dataHex) throw new Error('Malformed encrypted token');
  const attempt = (key: Buffer) => {
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'));
    return Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]).toString(
      'utf8'
    );
  };
  const key = configuredKey();
  if (key) {
    try {
      return attempt(key);
    } catch {
      // Fall through: the token may have been stored by v1 before a key was configured.
    }
  }
  return attempt(legacyKey());
}
