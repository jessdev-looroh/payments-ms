import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { PaymentProvider } from './payment-provider.interface';
import { PaymentMethodConfig } from '../interfaces/payment-method-config.interface';
import { PaymentSessionDto } from '../dto/payment-session.dto';
import { WebhookDataDto } from '../dto/webhook-data.dto';
import { PaymentSessionItemDto } from '../dto/payment-session-item.dto';
import { PaymentSessionItem } from '../interfaces/payment-session-item.interface';
import { envs, NATS_SERVICE } from 'src/config';
import { PaymentSucceededPayload } from 'src/interfaces/payment-succeeded-payload.interface';
import { PaymentAuditData } from 'src/payment-audit/interfaces/payment-audit-data.interface';
import { PaymentAuditService } from 'src/payment-audit/payment-audit.service';
import { ClientProxy, RpcException } from '@nestjs/microservices';

@Injectable()
export class StripeProvider implements PaymentProvider {
  private paymentMethodConfig: PaymentMethodConfig;
  private stripe: Stripe;
  private readonly logger = new Logger(StripeProvider.name);

  constructor(
    @Inject(NATS_SERVICE)
    private readonly client: ClientProxy,
    private readonly paymentAuditService: PaymentAuditService,
  ) {}
  initialize(paymentMethodConfig: PaymentMethodConfig) {
    this.paymentMethodConfig = paymentMethodConfig;
    this.stripe = new Stripe(paymentMethodConfig.credentials.secretKey ?? '');
  }

  async createPaymentSession(paymentSessionDto: PaymentSessionDto) {
    const { orderId, currency, items, paymentMethodId } = paymentSessionDto;
    const allItems = this.flattenOrderItems(items);
    const session = await this.stripe.checkout.sessions.create({
      payment_intent_data: { metadata: { orderId, paymentMethodId } },
      line_items: allItems.map((item) => ({
        price_data: {
          currency:
            currency?.toUpperCase() ??
            this.paymentMethodConfig.currency.toUpperCase(),
          product_data: { name: item.name },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: process.env.STRIPE_SUCCESS_URL!,
      cancel_url: process.env.STRIPE_CANCEL_URL!,
    });

    return {
      url: session.url,
      successUrl: session.success_url,
      cancelUrl: session.cancel_url,
    };
  }

  private flattenOrderItems(
    orderItems: PaymentSessionItemDto[],
  ): PaymentSessionItem[] {
    const result: PaymentSessionItem[] = [];

    const recurse = (items: any[], parentQuantity: number = 1) => {
      for (const item of items) {
        const itemName = item.sizeName
          ? `${item.name} - [${item.sizeName}]`
          : item.name;

        result.push({
          name: itemName,
          price: item.price,
          quantity: item.quantity * parentQuantity,
        });

        if (item.childItems && item.childItems.length > 0) {
          recurse(item.childItems, item.quantity);
        }
      }
    };

    recurse(orderItems);
    return result;
  }

  async handleWebhook(requestData: WebhookDataDto) {
    const startTime = Date.now();

    try {
      const rawBodyBuffer = Buffer.from(requestData.rawBody, 'base64');
      const sig = requestData.stripeSignature;
      const endpointSecret =
        this.paymentMethodConfig.credentials.endpointSecret;

      let event: Stripe.Event;
      event = this.stripe.webhooks.constructEvent(
        rawBodyBuffer,
        sig ?? '',
        endpointSecret,
      );

      const durationMs = Date.now() - startTime;
      let orderId = '';
      let transactionId = '';
      let status = 'processed';

      switch (event.type) {
        case 'charge.succeeded':
          const chargeSucceeded = event.data.object;
          orderId = chargeSucceeded.metadata.orderId;
          transactionId = chargeSucceeded.id;

          const payload: PaymentSucceededPayload = {
            orderId,
            receiptUrl: chargeSucceeded.receipt_url ?? '',
            paymentChargeId: transactionId,
          };

          this.logger.log('Payment succeeded:', payload);
          this.client.emit('payment.succeeded', payload);
          break;

        default:
          console.log(`Event ${event.type} not handled`);
          status = 'unhandled';
          break;
      }

      // Log audit data for webhook processing
      if (orderId) {
        const auditData: PaymentAuditData = {
          transactionId,
          orderId,
          provider: 'stripe',
          endpoint: '/webhook',
          method: 'POST',
          statusCode: 200,
          status,
          durationMs,
          requestBody: { eventType: event.type, eventId: event.id },
          responseBody: { processed: true },
        };

        // Audit the webhook processing (non-blocking)
        this.paymentAuditService.logTransaction(auditData).catch((error) => {
          this.logger.error(`Audit logging failed: ${error.message}`);
        });
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Webhook processed successfully',
      };
    } catch (err) {
      const durationMs = Date.now() - startTime;

      // Log audit data for failed webhook processing
      const auditData: PaymentAuditData = {
        transactionId: `ERROR-unknown-${new Date().toISOString()}`,
        orderId: 'unknown',
        provider: 'stripe',
        endpoint: '/webhook',
        method: 'POST',
        statusCode: 400,
        status: 'error',
        durationMs,
        requestBody: { rawBody: requestData.rawBody },
        responseBody: { error: err.message },
      };

      // Audit the failed webhook processing (non-blocking)
      this.paymentAuditService.logTransaction(auditData).catch((auditError) => {
        this.logger.error(`Audit logging failed: ${auditError.message}`);
      });

      console.log(`⚠️  Webhook signature verification failed.`, err.message);
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Webhook Error: ${err.message}`,
      });
    }
  }
}
