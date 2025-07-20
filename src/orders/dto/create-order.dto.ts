export class CreateOrderDto {
  treatmentId: string;
  clientDni: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  stylistId: string;
  cashierId: string;
  price: number;
}