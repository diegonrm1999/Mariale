import { PaymentMethod } from '@prisma/client';

export class CompleteOrderDto {
  paidAmount: number;
  paymentMethod: PaymentMethod;
  ticketNumber: string;
}
