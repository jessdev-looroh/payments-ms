import { Injectable, Logger } from '@nestjs/common';
import { PaymentProviderFactory } from '../providers/payment-provider.factory';
import { PaymentConfigService } from './payment-config.service';
import { PaymentSessionDto } from '../dto/payment-session.dto';
import { WebhookDataDto } from '../dto/webhook-data.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly factory: PaymentProviderFactory,
    private readonly configService: PaymentConfigService,
  ) {}

  async createPaymentSession(paymentSessionDto: PaymentSessionDto) {
    const config = await this.configService.getPaymentConfig(paymentSessionDto.paymentMethodId);
    const provider = this.factory.getProvider(config);
    return provider.createPaymentSession(paymentSessionDto);
  }

  async handleWebhook(requestData: WebhookDataDto) {
    const config = await this.configService.getPaymentConfig(requestData.paymentMethodId);
    const provider = this.factory.getProvider(config);
    return provider.handleWebhook(requestData);
  }
}



// import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
// import { envs, NATS_SERVICE } from 'src/config';
// import Stripe from 'stripe';
// import { ClientProxy, RpcException } from '@nestjs/microservices';
// import { SessionResponse } from 'src/interfaces/session-response.interface';
// import { PaymentSucceededPayload } from 'src/interfaces/payment-succeeded-payload.interface';
// import { PaymentAuditService } from 'src/payment-audit/payment-audit.service';
// import { PaymentSessionDto } from '../dto/payment-session.dto';
// import { PaymentAuditData } from 'src/payment-audit/interfaces/payment-audit-data.interface';
// import { PaymentSessionItemDto } from '../dto/payment-session-item.dto';
// import { PaymentSessionItem } from '../interfaces/payment-session-item.interface';
// import { WebhookDataDto } from '../dto/webhook-data.dto';

// @Injectable()
// export class PaymentsService {
//   private readonly stripe = new Stripe(envs.stripeSecret);
//   private readonly logger = new Logger(PaymentsService.name);
//   constructor(
//     @Inject(NATS_SERVICE)
//     private readonly client: ClientProxy,
//     private readonly paymentAuditService: PaymentAuditService,
//   ) {}

//   async createPaymentSession(paymentSessionDto: PaymentSessionDto) {
//     const startTime = Date.now();
//     const { currency, items, orderId } = paymentSessionDto;
//     const allItems = this.flattenOrderItems(items);

//     const payload: Stripe.Checkout.SessionCreateParams = {
//       payment_intent_data: {
//         metadata: {
//           orderId,
//         },
//       },
//       line_items: allItems.map((item) => ({
//         price_data: {
//           currency,
//           product_data: { name: item.name },
//           unit_amount: Math.round(item.price * 100),
//         },
//         quantity: item.quantity,
//       })),
//       mode: 'payment',
//       success_url: envs.stripeSuccessUrl,
//       cancel_url: envs.stripeCancelUrl,
//     };
//     try {
//       const session = await this.stripe.checkout.sessions.create(payload);

//       const durationMs = Date.now() - startTime;

//       // Log audit data
//       const auditData: PaymentAuditData = {
//         transactionId: session.id,
//         orderId,
//         provider: 'stripe',
//         endpoint: '/checkout/sessions',
//         method: 'POST',
//         statusCode: 200,
//         status: 'success',
//         durationMs,
//         requestBody: payload,
//         responseBody: session,
//       };

//       // Audit the transaction (non-blocking)
//       this.paymentAuditService.logTransaction(auditData).catch((error) => {
//         this.logger.error(`Audit logging failed: ${error.message}`);
//       });

//       const sessionResponse: SessionResponse = {
//         cancelUrl: session.cancel_url ?? '',
//         successUrl: session.success_url ?? '',
//         url: session.url ?? '',
//       };
//       return sessionResponse;
//     } catch (error) {
//       const durationMs = Date.now() - startTime;

//       // Log audit data for failed transaction
//       const auditData: PaymentAuditData = {
//         transactionId: `ERROR#${orderId}-${new Date().toISOString()}`,
//         orderId,
//         provider: 'stripe',
//         endpoint: '/checkout/sessions',
//         method: 'POST',
//         statusCode: 500,
//         status: 'error',
//         durationMs,
//         requestBody: payload,
//         responseBody: { error: error.message },
//       };

//       // Audit the failed transaction (non-blocking)
//       this.paymentAuditService.logTransaction(auditData).catch((auditError) => {
//         this.logger.error(`Audit logging failed: ${auditError.message}`);
//       });

//       throw error;
//     }
//   }

//   private flattenOrderItems(
//     orderItems: PaymentSessionItemDto[],
//   ): PaymentSessionItem[] {
//     const result: PaymentSessionItem[] = [];

//     const recurse = (items: any[]) => {
//       for (const item of items) {
//         const itemName = item.sizeName
//           ? `${item.name} - [${item.sizeName}]`
//           : item.name;

//         result.push({
//           name: itemName,
//           price: item.price,
//           quantity: item.quantity,
//         });

//         if (item.childItems && item.childItems.length > 0) {
//           recurse(item.childItems);
//         }
//       }
//     };

//     recurse(orderItems);
//     return result;
//   }

//   /**
//    * Processes Stripe webhook events
//    * @param requestData - Webhook data containing base64 encoded rawBody and signature
//    * @returns Promise with webhook processing result
//    */
//   stripeWebhook(requestData: WebhookDataDto) {

//   }
// }
