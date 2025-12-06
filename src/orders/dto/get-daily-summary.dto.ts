export class DailySummaryResponseDto {
  date: string;
  cashierId: string;
  totalEarnings: number;
  totalOrders: number;
  payments: {
    cash: number;
    yape: number;
    card: number;
  };
  ordersByStylist: {
    stylistId: string;
    stylistName: string;
    count: number;
  }[];
}
