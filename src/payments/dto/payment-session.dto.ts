import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsOptional,
  IsNumber,
  IsEmail,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentSessionItemDto } from './payment-session-item.dto';

/**
 * DTO for creating a payment session.
 */
export class PaymentSessionDto {

  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @IsOptional()
  @IsString()
  tokenId?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  totalAmount?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentSessionItemDto)
  items: PaymentSessionItemDto[];
}
