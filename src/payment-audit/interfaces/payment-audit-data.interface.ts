/**
 * Payment Audit Data Interface
 * 
 * This interface defines the structure for payment audit data
 * that will be processed by the audit service.
 */
export interface PaymentAuditData {
  transactionId: string;
  orderId: string;
  provider: string;
  endpoint: string;
  method: string;
  statusCode: number;
  status: string;
  durationMs: number;
  ipAddress?: string;
  requestBody?: Record<string, any>;
  responseBody?: Record<string, any>;
}


