import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PaymentSessionItemDto } from './payment-session-item.dto';

export class PaymentSessionDto {
  @IsString()
  orderId: string;

  @IsString()
  currency: string;

  @IsArray()
  @ArrayMinSize(1)
  @Type(() => PaymentSessionItemDto)
  @ValidateNested({ each: true })
  items: PaymentSessionItemDto[];
}
