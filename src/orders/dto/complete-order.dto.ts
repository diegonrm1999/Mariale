import { PaymentMethod } from '@prisma/client';
import { IsNumber, IsEnum, IsString, IsNotEmpty } from 'class-validator';

export class CompleteOrderDto {
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsString()
  @IsNotEmpty()
  ticketNumber: string;
}
