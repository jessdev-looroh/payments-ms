import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { NatsModule } from '../transport/nats.module';
import { PaymentAuditModule } from '../payment-audit/payment-audit.module';
import { PaymentsService } from './services/payments.service';
import { PaymentConfigService } from './services/payment-config.service';
import { PaymentProviderFactory } from './providers/payment-provider.factory';
import { StripeProvider } from './providers/stripe.provider';
import { CulqiProvider } from './providers/culqi.provider';
import { PaymentAuditService } from 'src/payment-audit/payment-audit.service';
import { HttpModule } from '@nestjs/axios';
import { AwsModule } from 'src/aws/aws.module';
import { CryptoModule } from 'src/shared/encrypt/crypto.module';

/**
 * Payments Module
 *
 * This module provides payment processing functionality with integrated audit logging.
 * It includes Stripe payment processing and comprehensive audit trails.
 */
@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymentConfigService,
    PaymentProviderFactory,
    StripeProvider,
    CulqiProvider,
    PaymentAuditService,
  ],
  imports: [
    NatsModule,
    PaymentAuditModule,
    HttpModule,
    AwsModule,
    CryptoModule,
  ],
})
export class PaymentsModule {}
