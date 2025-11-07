import { IsString, IsOptional, IsObject, IsNotEmpty } from 'class-validator';

/**
 * DTO representing the structure of webhook data received from providers.
 */
export class WebhookDataDto {
  @IsString()
  rawBody: string;

  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;

  @IsOptional()
  @IsString()
  stripeSignature?: string;

  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;
}
