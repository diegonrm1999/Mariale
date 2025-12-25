import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { DateUtils } from 'src/utils/date.utils';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSimpleStats(shopId: string): Promise<DashboardStats> {
    const nowPeru = DateUtils.getNowInPeru();

    const startOfToday = DateUtils.getStartOfDayUTC(nowPeru);
    const startOfWeek = DateUtils.getStartOfWeekUTC(nowPeru);
    const startOfMonth = DateUtils.getStartOfMonthUTC(nowPeru);

    const [
      totalClients,
      ordersToday,
      ordersThisWeek,
      ordersThisMonth,
      salesToday,
      salesThisWeek,
      salesThisMonth,
      topStylistData,
    ] = await Promise.all([
      this.prisma.client.count({
        where: { shopId },
      }),

      this.prisma.order.count({
        where: {
          shopId,
          createdAt: { gte: startOfToday },
        },
      }),

      this.prisma.order.count({
        where: {
          shopId,
          createdAt: { gte: startOfWeek },
        },
      }),

      this.prisma.order.count({
        where: {
          shopId,
          createdAt: { gte: startOfMonth },
        },
      }),

      this.prisma.order.aggregate({
        where: {
          shopId,
          createdAt: { gte: startOfToday },
          status: OrderStatus.Completed,
        },
        _sum: { totalPrice: true },
      }),

      this.prisma.order.aggregate({
        where: {
          shopId,
          createdAt: { gte: startOfWeek },
          status: OrderStatus.Completed,
        },
        _sum: { totalPrice: true },
      }),

      this.prisma.order.aggregate({
        where: {
          shopId,
          createdAt: { gte: startOfMonth },
          status: OrderStatus.Completed,
        },
        _sum: { totalPrice: true },
      }),

      this.prisma.user.findMany({
        where: {
          shopId,
          role: 'Stylist',
        },
        include: {
          _count: {
            select: {
              stylistOrders: {
                where: {
                  createdAt: { gte: startOfWeek },
                },
              },
            },
          },
        },
        orderBy: {
          stylistOrders: {
            _count: 'desc',
          },
        },
        take: 1,
      }),
    ]);

    let topStylistWeek = null;
    if (
      topStylistData.length > 0 &&
      topStylistData[0]._count.stylistOrders > 0
    ) {
      topStylistWeek = {
        name: `${topStylistData[0].firstName} ${topStylistData[0].lastName}`,
        orders: topStylistData[0]._count.stylistOrders,
      };
    }

    return {
      totalClients,
      ordersToday,
      ordersThisWeek,
      ordersThisMonth,
      salesToday: salesToday._sum.totalPrice || 0,
      salesThisWeek: salesThisWeek._sum.totalPrice || 0,
      salesThisMonth: salesThisMonth._sum.totalPrice || 0,
      topStylistWeek,
    };
  }
}
