import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsNumber, IsOptional, IsPositive, IsString, IsUUID, ValidateNested } from "class-validator";

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
  
    @IsArray()
    @Type(() => PaymentSessionItemDto)
    @ValidateNested({ each: true })
    childItems: PaymentSessionItemDto[];
  }
  
  
  