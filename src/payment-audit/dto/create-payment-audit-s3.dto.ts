export class CreatePaymentAudiS3tDto {
    transactionId: string;
    orderId: string;
    provider: string;
    endpoint: string;
    method: string;
    statusCode: number;
    status: string;
    durationMs: number;
    ipAddress?: string;
    requestBody: Record<string, any>;
    responseBody: Record<string, any>;
  }
