import { Injectable } from '@nestjs/common';
import { envs } from 'src/config';
import Stripe from 'stripe';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { Request, Response } from 'express';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(envs.stripeSecret);

  async createPaymentSession(paymentSessionDto: PaymentSessionDto) {
    const { currency, items, orderId } = paymentSessionDto;
    const session = await this.stripe.checkout.sessions.create({
      payment_intent_data: {
        metadata: {
          orderId,
        },
      },
      line_items: items.map((item) => ({
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
    });
    return session;
  }

  stripeWebhook(req: Request, res: Response) {
    try {
      const rawBody = req['rawBody'];
      const sig = req.headers['stripe-signature'] ?? '';
      const endpointSecret = envs.stripeEndpointSecret;
      let event: Stripe.Event;
      event = this.stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);

      switch (event.type) {
        case 'charge.succeeded':
          const chargeSucceeded = event.data.object;
          //TODO: Llamar a nuestro microservicio.
          console.log(chargeSucceeded.metadata);
          break;

        default:
          console.log(`Event ${event.type} not handled`);
          break;
      }

      return res.status(200).json({ sig });
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
}
