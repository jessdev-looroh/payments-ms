import { Injectable, Logger } from '@nestjs/common';
import { DynamoDBService } from '../../aws/services/dynamodb.service';
import { AuditStorageStrategy } from '../interfaces/audit-storage-strategy.interface';
import { CreatePaymentAuditDynamoDto } from '../dto/create-payment-audit-dynamo.dto';

/**
 * DynamoDB Audit Strategy
 * 
 * This strategy implements the storage of payment audit data in DynamoDB.
 * It follows the Strategy pattern for flexible storage implementations.
 */
@Injectable()
export class DynamoDBAuditStrategy implements AuditStorageStrategy {
  private readonly logger = new Logger(DynamoDBAuditStrategy.name);
  private readonly tableName = 'payment_audit_logs';
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  constructor(private readonly dynamoDBService: DynamoDBService) {}

  /**
   * Stores payment audit data in DynamoDB with retry mechanism
   * 
   * @param auditData - The audit data to store in DynamoDB
   * @returns Promise<boolean> - Returns true if successful, false otherwise
   */
  async store(auditData: CreatePaymentAuditDynamoDto): Promise<boolean> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const success = await this.dynamoDBService.storeItem(this.tableName, auditData);
        
        if (success) {
          this.logger.log(`Successfully stored audit data in DynamoDB for transaction: ${auditData.transactionId}`);
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

    this.logger.error(`Failed to store audit data in DynamoDB after ${this.maxRetries} attempts for transaction: ${auditData.transactionId}`);
    return false;
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
