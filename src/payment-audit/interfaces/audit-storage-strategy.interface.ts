import { CreatePaymentAuditDynamoDto } from '../dto/create-payment-audit-dynamo.dto';
import { CreatePaymentAudiS3tDto } from '../dto/create-payment-audit-s3.dto';

/**
 * Audit Storage Strategy Interface
 * 
 * This interface defines the contract for different storage strategies
 * in the payment audit system using the Strategy pattern.
 */
export interface AuditStorageStrategy {
  /**
   * Stores payment audit data using the specific strategy
   * 
   * @param auditData - The audit data to store
   * @returns Promise<boolean> - Returns true if successful, false otherwise
   */
  store(auditData: CreatePaymentAuditDynamoDto | CreatePaymentAudiS3tDto): Promise<boolean>;
}
