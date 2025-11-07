import { Module } from '@nestjs/common';
import { CryptoService } from './crypto.service';

/**
 * CryptoModule
 * 
 * NestJS module responsible for providing encryption and decryption services
 * throughout the application.
 * 
 * Exports:
 *   - CryptoService: Service for handling cryptographic operations.
 */
@Module({
  providers: [CryptoService],
  exports: [CryptoService],
})
export class CryptoModule {}

