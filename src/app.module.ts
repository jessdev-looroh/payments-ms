import { Module } from '@nestjs/common';
import { PaymentsModule } from './payments/payments.module';
import { NatsModule } from './transport/nats.module';
import { PaymentAuditModule } from './payment-audit/payment-audit.module';

@Module({
  imports: [PaymentsModule, NatsModule, PaymentAuditModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
