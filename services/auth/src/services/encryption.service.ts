import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { createLogger } from '@auralux/shared';

const logger = createLogger('auth-encryption');

export function encrypt(data: string): string {
  try {
    return CryptoJS.AES.encrypt(data, config.security.encryptionKey).toString();
  } catch (error) {
    logger.error('Encryption failed', { error });
    throw new Error('Encryption failed');
  }
}

export function decrypt(encryptedData: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, config.security.encryptionKey);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) {
      throw new Error('Decryption produced empty result');
    }
    return decrypted;
  } catch (error) {
    logger.error('Decryption failed', { error });
    throw new Error('Decryption failed');
  }
}

export function generateState(): string {
  return uuidv4();
}

export function generateSessionId(): string {
  return `sess_${uuidv4().replace(/-/g, '')}`;
}

export function hashToken(token: string): string {
  return CryptoJS.SHA256(token).toString();
}
