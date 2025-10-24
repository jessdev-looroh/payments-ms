export class CreatePaymentAuditDynamoDto {
  transactionId: string;
  timestamp: string;
  orderId: string;
  provider: string;
  endpoint: string;
  method: string;
  statusCode: number;
  status: string;
  durationMs: number;
  ipAddress?: string;
  logUrl: string;
  createdAt: string;
  updatedAt: string;
}
