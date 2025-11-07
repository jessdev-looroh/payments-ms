import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { envs } from 'src/config';

/**
 * Service responsible for encrypting and decrypting sensitive data.
 */
@Injectable()
export class CryptoService {
  private readonly algorithm = envs.cryptoAlgorithm;
  private readonly key = Buffer.from(envs.cryptoMasterKey, 'hex');

  // --- ENCRYPT ---
  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(12); 
    const cipher = crypto.createCipheriv(
      this.algorithm,
      this.key,
      iv,
    ) as crypto.CipherGCM;

    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

    return Buffer.concat([iv, encrypted, tag]).toString('base64');
  }

  // --- DECRYPT ---
  decrypt(ciphertext: string): string {
    const buffer = Buffer.from(ciphertext, 'base64');
    const iv = buffer.subarray(0, 12);
    const tag = buffer.subarray(buffer.length - 16);
    const encrypted = buffer.subarray(12, buffer.length - 16);

    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      iv,
    ) as crypto.DecipherGCM;
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }
}
