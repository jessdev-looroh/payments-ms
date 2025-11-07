import { PaymentSessionDto } from '../dto/payment-session.dto';
import { WebhookDataDto } from '../dto/webhook-data.dto';

export interface PaymentProvider {
  createPaymentSession(paymentSessionDto: PaymentSessionDto): Promise<any>;
  handleWebhook(requestData: WebhookDataDto): Promise<any>;
}
