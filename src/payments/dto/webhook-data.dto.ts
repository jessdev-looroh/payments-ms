import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for webhook data containing raw body and stripe signature
 * The rawBody is sent as base64 string to preserve Buffer data through NATS serialization
 */
export class WebhookDataDto {
  @IsNotEmpty()
  @IsString()
  rawBody: string; // Base64 encoded string of the original Buffer

  @IsString()
  @IsNotEmpty()
  stripeSignature: string;
}
