import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PaymentProvider } from './payment-provider.interface';
import { PaymentAuditService } from 'src/payment-audit/payment-audit.service';
import { PaymentSessionDto } from '../dto/payment-session.dto';
import { PaymentAuditData } from 'src/payment-audit/interfaces/payment-audit-data.interface';
import { PaymentMethodConfig } from '../interfaces/payment-method-config.interface';

/**
 * Culqi payment provider implementation.
 * Handles session creation and payment verification using Culqi REST API.
 */
@Injectable()
export class CulqiProvider implements PaymentProvider {
  private readonly logger = new Logger(CulqiProvider.name);

  private paymentMethodConfig: PaymentMethodConfig;

  private readonly baseUrl = 'https://api.culqi.com/v2';

  constructor(
    private readonly httpService: HttpService,
    private readonly paymentAuditService: PaymentAuditService,
  ) {}

  initialize(paymentMethodConfig: PaymentMethodConfig) {
    this.paymentMethodConfig = paymentMethodConfig;
  }

  /**
   * Creates a payment charge with Culqi
   * @param sessionDto - Payment session details (amount, currency, orderId, etc.)
   * @param paymentMethodConfig - Provider configuration (public/private keys)
   * @returns Promise with PaymentResponse data
   */
  async createPaymentSession(sessionDto: PaymentSessionDto): Promise<any> {
    const startTime = Date.now();
    const { orderId, currency, items } = sessionDto;

    const amount = Math.round(
      items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100,
    );

    const payload = {
      amount,
      currency_code:
        currency?.toUpperCase() ??
        this.paymentMethodConfig.currency.toUpperCase(),
      description: `Pago de orden ${orderId}`,
      email: sessionDto.customerEmail ?? 'guest@qehay.app',
      source_id: sessionDto.tokenId, // el token viene del frontend
    };

    try {
      const { data } = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/charges`, payload, {
          headers: {
            Authorization: `Bearer ${this.paymentMethodConfig.credentials.privateKey ?? ''}`,
            'Content-Type': 'application/json',
          },
          timeout: 8000,
        }),
      );

      const durationMs = Date.now() - startTime;

      // Audit successful transaction
      const auditData: PaymentAuditData = {
        transactionId: data.id,
        orderId,
        provider: 'culqi',
        endpoint: '/charges',
        method: 'POST',
        statusCode: HttpStatus.OK,
        status: 'success',
        durationMs,
        requestBody: payload,
        responseBody: data,
      };
      this.paymentAuditService
        .logTransaction(auditData)
        .catch((e) => this.logger.error(`Audit logging failed: ${e.message}`));

      return {
        provider: 'culqi',
        orderId,
        transactionId: data.id,
        receiptUrl: data.outcome?.merchant_message ?? '',
        message: 'Payment successful via Culqi',
      };
    } catch (error: any) {
      const durationMs = Date.now() - startTime;

      const auditData: PaymentAuditData = {
        transactionId: `ERROR#${orderId}-${new Date().toISOString()}`,
        orderId,
        provider: 'culqi',
        endpoint: '/charges',
        method: 'POST',
        statusCode: error.response?.status || 500,
        status: 'error',
        durationMs,
        requestBody: payload,
        responseBody: error.response?.data || { error: error.message },
      };
      this.paymentAuditService
        .logTransaction(auditData)
        .catch((e) => this.logger.error(`Audit logging failed: ${e.message}`));

      this.logger.error(
        `❌ Culqi charge failed for order ${orderId}: ${error.message}`,
      );

      return {
        provider: 'culqi',
        orderId,
        transactionId: null,
        receiptUrl: '',
        message:
          error.response?.data?.user_message || 'Payment failed via Culqi',
      };
    }
  }

  async handleWebhook(webhookDataDto: any) {
    this.logger.log(`Received Culqi webhook: ${webhookDataDto.event}`);

    // Verificar firma si aplica (Culqi no firma igual que Stripe)
    const eventType = webhookDataDto.type;
    const charge = webhookDataDto.data.object;

    switch (eventType) {
      case 'charge.succeeded':
        this.logger.log(
          `✅ Culqi payment succeeded for order ${charge.metadata?.orderId}`,
        );
        // Aquí podrías emitir evento: this.client.emit('payment.succeeded', { ... })
        break;

      case 'charge.failed':
        this.logger.warn(
          `❌ Culqi payment failed for order ${charge.metadata?.orderId}`,
        );
        break;

      default:
        this.logger.warn(`Unhandled Culqi event type: ${eventType}`);
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Webhook processed successfully',
    };
  }
}
