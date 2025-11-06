import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { envs, NATS_SERVICE } from 'src/config';
import Stripe from 'stripe';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { WebhookDataDto } from './dto/webhook-data.dto';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { SessionResponse } from 'src/interfaces/session-response.interface';
import { PaymentSucceededPayload } from 'src/interfaces/payment-succeeded-payload.interface';
import { PaymentAuditService } from '../payment-audit/payment-audit.service';
import { PaymentAuditData } from '../payment-audit/interfaces/payment-audit-data.interface';
import { PaymentSessionItemDto } from './dto/payment-session-item.dto';
import { PaymentSessionItem } from './interfaces/payment-session-item.interface';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(envs.stripeSecret);
  private readonly logger = new Logger(PaymentsService.name);
  constructor(
    @Inject(NATS_SERVICE)
    private readonly client: ClientProxy,
    private readonly paymentAuditService: PaymentAuditService,
  ) {}

  async createPaymentSession(paymentSessionDto: PaymentSessionDto) {
    const startTime = Date.now();
    const { currency, items, orderId } = paymentSessionDto;
    const allItems = this.flattenOrderItems(items);

    const payload: Stripe.Checkout.SessionCreateParams = {
      payment_intent_data: {
        metadata: {
          orderId,
        },
      },
      line_items: allItems.map((item) => ({
        price_data: {
          currency,
          product_data: { name: item.name },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: envs.stripeSuccessUrl,
      cancel_url: envs.stripeCancelUrl,
    };
    try {
      const session = await this.stripe.checkout.sessions.create(payload);

      const durationMs = Date.now() - startTime;

      // Log audit data
      const auditData: PaymentAuditData = {
        transactionId: session.id,
        orderId,
        provider: 'stripe',
        endpoint: '/checkout/sessions',
        method: 'POST',
        statusCode: 200,
        status: 'success',
        durationMs,
        requestBody: payload,
        responseBody: session,
      };

      // Audit the transaction (non-blocking)
      this.paymentAuditService.logTransaction(auditData).catch((error) => {
        this.logger.error(`Audit logging failed: ${error.message}`);
      });

      const sessionResponse: SessionResponse = {
        cancelUrl: session.cancel_url ?? '',
        successUrl: session.success_url ?? '',
        url: session.url ?? '',
      };
      return sessionResponse;
    } catch (error) {
      const durationMs = Date.now() - startTime;

      // Log audit data for failed transaction
      const auditData: PaymentAuditData = {
        transactionId: `ERROR#${orderId}-${new Date().toISOString()}`,
        orderId,
        provider: 'stripe',
        endpoint: '/checkout/sessions',
        method: 'POST',
        statusCode: 500,
        status: 'error',
        durationMs,
        requestBody: payload,
        responseBody: { error: error.message },
      };

      // Audit the failed transaction (non-blocking)
      this.paymentAuditService.logTransaction(auditData).catch((auditError) => {
        this.logger.error(`Audit logging failed: ${auditError.message}`);
      });

      throw error;
    }
  }

  private flattenOrderItems(orderItems: PaymentSessionItemDto[]): PaymentSessionItem[] {
    const result: PaymentSessionItem[] = [];

    const recurse = (items: any[]) => {
      for (const item of items) {
        const itemName = item.sizeName
          ? `${item.name} - [${item.sizeName}]`
          : item.name;

        result.push({

          name: itemName,
          price: item.price,
          quantity: item.quantity,
        });

        if (item.childItems && item.childItems.length > 0) {
          recurse(item.childItems);
        }
      }
    };

    recurse(orderItems);
    return result;
  }

  /**
   * Processes Stripe webhook events
   * @param requestData - Webhook data containing base64 encoded rawBody and signature
   * @returns Promise with webhook processing result
   */
  stripeWebhook(requestData: WebhookDataDto) {
    const startTime = Date.now();

    try {
      const rawBodyBuffer = Buffer.from(requestData.rawBody, 'base64');
      const sig = requestData.stripeSignature;
      const endpointSecret = envs.stripeEndpointSecret;

      let event: Stripe.Event;
      event = this.stripe.webhooks.constructEvent(
        rawBodyBuffer,
        sig,
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
