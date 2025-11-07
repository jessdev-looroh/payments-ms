import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsInt,
  IsPositive,
  IsOptional,
  ValidateNested,
  IsArray,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Represents a single product or line item in a payment session.
 */
export class PaymentSessionItemDto {
  @IsString()
  @IsUUID()
  productId: string;

  @IsOptional()
  sizeName?: string;

  @IsOptional()
  sizePrice?: number;

  @IsString()
  name: string;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  itemStatus?: string;
  
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentSessionItemDto)
  childItems?: PaymentSessionItemDto[];
}
