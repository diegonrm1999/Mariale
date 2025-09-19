export interface OrderReceiptData {
  orderNumber: string;
  ticketNumber: string;
  clientName: string;
  clientEmail: string;
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  shopRuc: string;
  date: string;
  time: string;
  stylistName: string;
  operatorName: string;
  cashierName: string;
  treatments: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  totalPrice: number;
  paidAmount: number;
  paymentMethod: string;
  currency: string;
}
