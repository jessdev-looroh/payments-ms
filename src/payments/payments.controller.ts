import { Controller, Logger, BadRequestException } from '@nestjs/common';
import { PaymentsService } from './services/payments.service';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { WebhookDataDto } from './dto/webhook-data.dto';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Creates a new payment session for the given payment data
   * @param paymentSessionDto - The payment session data containing order information
   * @returns Promise with the created payment session details
   */
  @MessagePattern('create.payment.session')
  createPaymentSession(@Payload() paymentSessionDto: PaymentSessionDto) {
    this.logger.log(
      `Creating payment session for order: ${paymentSessionDto.orderId}`,
    );
    return this.paymentsService.createPaymentSession(paymentSessionDto);
  }

  /**
   * Handles successful payment completion
   * @returns Object indicating successful payment status
   */
  @MessagePattern('payments.success')
  success() {
    this.logger.log('Payment completed successfully');
    return {
      ok: true,
      message: 'Payment successful',
    };
  }
  /**
   * Handles payment cancellation
   * @returns Object indicating cancelled payment status
   */
  @MessagePattern('payments.cancel')
  cancel() {
    this.logger.warn('Payment was cancelled by user');
    return {
      ok: false,
      message: 'Payment cancelled',
    };
  }

  /**
   * Handles Stripe webhook events for payment processing
   * @param requestData - The webhook data received from Stripe
   * @returns Promise with the webhook processing result
   */
  @MessagePattern('payments.stripe.webhook')
  stripeWebhook(@Payload() requestData: WebhookDataDto) {
    this.logger.log(
      `Processing Stripe webhook with signature: ${requestData.stripeSignature?.substring(0, 20)}...`,
    );
    return this.paymentsService.handleWebhook(requestData);
  }
}
