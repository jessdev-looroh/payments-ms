import { Module } from '@nestjs/common';
import { PaymentAuditService } from './payment-audit.service';
import { AwsModule } from '../aws/aws.module';
import { DynamoDBAuditStrategy } from './strategies/dynamodb-audit-strategy';
import { S3AuditStrategy } from './strategies/s3-audit-strategy';

/**
 * Payment Audit Module
 * 
 * This module provides payment audit functionality using the Strategy pattern.
 * It includes DynamoDB and S3 storage strategies for comprehensive audit logging.
 */
@Module({
  imports: [AwsModule],
  providers: [
    PaymentAuditService,
    DynamoDBAuditStrategy,
    S3AuditStrategy,
  ],
  exports: [PaymentAuditService, DynamoDBAuditStrategy, S3AuditStrategy],
})
export class PaymentAuditModule {}
