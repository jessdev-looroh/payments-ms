/**
 * Represents the payment method configuration stored in DynamoDB.
 */
export interface PaymentMethodConfig {
  PK: string; // Unique ID (e.g., restaurantId#paymentMethodId)
  SK: string;
  configs: Record<string, string>;
  credentials: Record<string, string>;
  currency: string;
  enabled: boolean;
  paymentMethodId: string;
  restaurantId: string;
  providerKey: string;

  createdAt: Date;
  updatedAt: Date;
}
