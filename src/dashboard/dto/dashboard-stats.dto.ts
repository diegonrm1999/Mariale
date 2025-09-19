interface DashboardStats {
  totalClients: number;
  ordersToday: number;
  ordersThisWeek: number;
  ordersThisMonth: number;
  salesToday: number;
  salesThisWeek: number;
  salesThisMonth: number;
  topStylistWeek: {
    name: string;
    orders: number;
  } | null;
}