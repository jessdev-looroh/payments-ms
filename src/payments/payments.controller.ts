import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { Request, Response } from 'express';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-payment-session')
  createPaymentSession(@Body() paymentSessionDto: PaymentSessionDto) {
    return this.paymentsService.createPaymentSession(paymentSessionDto);
  }

  @Get('success')
  success() {
    console.log('Success');
    return {
      ok: true,
      message: 'Payment successful',
    };
  }
  @Get('cancel')
  cancel() {
    console.log('Cancel');
    return {
      ok: false,
      message: 'Payment cancelled',
    };
  }

  @Post('webhook')
  async stripWebhook(@Req() req: Request, @Res() res: Response) {
    console.log('Webhook');
    return this.paymentsService.stripeWebhook(req, res);
  }
}
