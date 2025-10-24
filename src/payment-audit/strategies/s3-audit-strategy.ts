import { Injectable, Logger } from '@nestjs/common';
import { S3Service } from '../../aws/services/s3.service';
import { AuditStorageStrategy } from '../interfaces/audit-storage-strategy.interface';
import { CreatePaymentAudiS3tDto } from '../dto/create-payment-audit-s3.dto';
import { envs } from 'src/config';

/**
 * S3 Audit Strategy
 * 
 * This strategy implements the storage of payment audit data in S3.
 * It follows the Strategy pattern for flexible storage implementations.
 */
@Injectable()
export class S3AuditStrategy implements AuditStorageStrategy {
  private readonly logger = new Logger(S3AuditStrategy.name);
  private readonly bucketName = envs.awsS3BucketName ?? '';
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  constructor(private readonly s3Service: S3Service) {}

  /**
   * Stores payment audit data in S3 with retry mechanism
   * 
   * @param auditData - The audit data to store in S3
   * @returns Promise<boolean> - Returns true if successful, false otherwise
   */
  async store(auditData: CreatePaymentAudiS3tDto): Promise<boolean> {
    const s3Key = this.generateS3Key(auditData.transactionId);

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const success = await this.s3Service.storeObject(this.bucketName, s3Key, auditData);
        
        if (success) {
          this.logger.log(`Successfully stored audit data in S3: ${s3Key}`);
          return true;
        }

        if (attempt < this.maxRetries) {
          this.logger.warn(`Attempt ${attempt} failed, retrying in ${this.retryDelay}ms...`);
          await this.delay(this.retryDelay * attempt);
        }
      } catch (error) {
        this.logger.error(`Attempt ${attempt} failed with error: ${error.message}`, error.stack);
        
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    this.logger.error(`Failed to store audit data in S3 after ${this.maxRetries} attempts for transaction: ${auditData.transactionId}`);
    return false;
  }

  /**
   * Generates the S3 key based on the transaction ID and current date
   * 
   * @param transactionId - The transaction ID
   * @returns string - The S3 key path
   */
  private generateS3Key(transactionId: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    return `${year}/${month}/${day}/${transactionId}.json`;
  }

  /**
   * Delays execution for the specified number of milliseconds
   * 
   * @param ms - The number of milliseconds to delay
   * @returns Promise<void>
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
