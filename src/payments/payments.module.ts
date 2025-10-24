import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { NatsModule } from '../transport/nats.module';
import { PaymentAuditModule } from '../payment-audit/payment-audit.module';

/**
 * Payments Module
 * 
 * This module provides payment processing functionality with integrated audit logging.
 * It includes Stripe payment processing and comprehensive audit trails.
 */
@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService],
  imports: [NatsModule, PaymentAuditModule]
})
export class PaymentsModule {}
