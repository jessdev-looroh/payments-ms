import { Injectable, Logger } from '@nestjs/common';
import { DynamoDBAuditStrategy } from './strategies/dynamodb-audit-strategy';
import { S3AuditStrategy } from './strategies/s3-audit-strategy';
import { PaymentAuditData } from './interfaces/payment-audit-data.interface';
import { CreatePaymentAuditDynamoDto } from './dto/create-payment-audit-dynamo.dto';
import { CreatePaymentAudiS3tDto } from './dto/create-payment-audit-s3.dto';
import { envs } from 'src/config';

/**
 * Payment Audit Service
 *
 * This service handles payment audit operations using the Strategy pattern.
 * It coordinates between DynamoDB and S3 storage strategies for comprehensive audit logging.
 */
@Injectable()
export class PaymentAuditService {
  private readonly logger = new Logger(PaymentAuditService.name);

  constructor(
    private readonly dynamoDBAuditStrategy: DynamoDBAuditStrategy,
    private readonly s3AuditStrategy: S3AuditStrategy,
  ) {}

  /**
   * Logs a payment transaction using both DynamoDB and S3 strategies
   *
   * @param auditData - The payment audit data to log
   * @returns Promise<void> - Does not throw errors to avoid affecting main transaction
   */
  async logTransaction(auditData: PaymentAuditData): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      const { transactionId } = auditData;
      // Create DynamoDB audit data
      const dynamoAuditData: CreatePaymentAuditDynamoDto = {
        transactionId,
        timestamp,
        orderId: auditData.orderId,
        provider: auditData.provider,
        endpoint: auditData.endpoint,
        method: auditData.method,
        statusCode: auditData.statusCode,
        status: auditData.status,
        durationMs: auditData.durationMs,
        ipAddress: auditData.ipAddress || '',
        logUrl: this.generateLogUrl(transactionId),
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      // Create S3 audit data
      const s3AuditData: CreatePaymentAudiS3tDto = {
        transactionId,
        orderId: auditData.orderId,
        provider: auditData.provider,
        endpoint: auditData.endpoint,
        method: auditData.method,
        statusCode: auditData.statusCode,
        status: auditData.status,
        durationMs: auditData.durationMs,
        ipAddress: auditData.ipAddress,
        requestBody: auditData.requestBody || {},
        responseBody: auditData.responseBody || {},
      };

      // Execute both strategies in parallel
      const [dynamoSuccess, s3Success] = await Promise.allSettled([
        this.dynamoDBAuditStrategy.store(dynamoAuditData),
        this.s3AuditStrategy.store(s3AuditData),
      ]);

      // Log results
      this.logger.log(
        `Audit logging completed for transaction: ${transactionId}`,
      );

      if (dynamoSuccess.status === 'rejected') {
        this.logger.error(`DynamoDB audit failed: ${dynamoSuccess.reason}`);
      }

      if (s3Success.status === 'rejected') {
        this.logger.error(`S3 audit failed: ${s3Success.reason}`);
      }
    } catch (error) {
      this.logger.error(
        `Payment audit logging failed: ${error.message}`,
        error.stack,
      );
      // Do not throw error to avoid affecting main transaction
    }
  }

  /**
   * Generates a log URL for the transaction
   *
   * @param transactionId - The transaction ID
   * @returns string - The log URL
   */
  private generateLogUrl(transactionId: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    //TODO: bucket name in envs
    return `https://${envs.awsRegion}.console.aws.amazon.com/s3/object/${envs.awsS3BucketName}?region=${envs.awsRegion}&bucketType=general&prefix=${year}/${month}/${day}/${transactionId}.json`;
    // return `https://s3.amazonaws.com/payment-audit-logs-test`;
  }
}
