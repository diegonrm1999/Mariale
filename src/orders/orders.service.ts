import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderStatus, Prisma, Role } from '@prisma/client';
import { OrdersGateway } from './orders.gateway';
import { CompleteOrderDto } from './dto/complete-order.dto';
import { NotificationService } from 'src/services/notification.service';
import { AuthUser } from 'src/auth/models/auth-user';
import { ClientsService } from 'src/client/clients.service';
import { UsersService } from 'src/users/users.service';
import { TreatmentsService } from 'src/treatments/treatments.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private readonly orderGateway: OrdersGateway,
    private readonly notificationService: NotificationService,
    private readonly clientService: ClientsService,
    private readonly userService: UsersService,
    private readonly treatmentService: TreatmentsService,
  ) {}

  private async findOrderByIdWithSelect<T extends Prisma.OrderSelect>(
    id: string,
    select: T,
  ): Promise<Prisma.OrderGetPayload<{ select: T }>> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select,
    });

    if (!order) {
      throw new Error(`Orden no encontrada`);
    }

    return order;
  }

  async createOrder(dto: CreateOrderDto, user: AuthUser) {
    await this.userService.ensureCanCreateOrder(user.id);
    await this.treatmentService.validateTreatments(
      dto.treatments.map((t) => t.treatmentId),
    );
    let clientId = await this.clientService.upsertOrderClient(dto, user.shopId);

    const totalPrice = dto.treatments.reduce(
      (sum, treatment) => sum + treatment.price,
      0,
    );

    const createdOrder = await this.prisma.order.create({
      data: {
        stylistId: dto.stylistId,
        cashierId: dto.cashierId,
        clientId: clientId,
        operatorId: user.id,
        shopId: user.shopId,
        totalPrice: totalPrice,
        treatments: {
          create: dto.treatments.map((t) => ({
            treatmentId: t.treatmentId,
            price: t.price,
          })),
        },
      },
      include: {
        treatments: true,
      },
    });
    this.orderGateway.emitOrderRefresh(
      createdOrder.operatorId,
      createdOrder.cashierId,
      user.id,
    );
    await this.notificationService.assignCashierNotification(dto.cashierId);
    return createdOrder;
  }

  async restoreOrder(id: string, userId: string) {
    const order = await this.findOrderByIdWithSelect(id, {
      status: true,
      cashierId: true,
      operatorId: true,
    });

    if (order.status !== OrderStatus.Completed) {
      throw new Error('Solo ordenes completadas pueden ser restauradas');
    }

    const restoredOrder = this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.Created,
      },
    });

    this.orderGateway.completeRefresh(
      order.operatorId,
      order.cashierId,
      userId,
    );
    this.orderGateway.emitOrderRefresh(
      order.operatorId,
      order.cashierId,
      userId,
    );
    return restoredOrder;
  }

  async completeOrder(id: string, dto: CompleteOrderDto, userId: string) {
    const order = await this.findOrderByIdWithSelect(id, {
      status: true,
      cashierId: true,
      operatorId: true,
      totalPrice: true,
    });

    if (order.status === OrderStatus.Completed) {
      throw new Error('Orden ya está completada');
    }

    const orderUpdated = this.prisma.order.update({
      where: { id },
      data: {
        paidAmount: order.totalPrice,
        paymentMethod: dto.paymentMethod,
        status: OrderStatus.Completed,
        ticketNumber: dto.ticketNumber,
      },
    });

    this.orderGateway.completeRefresh(
      order.operatorId,
      order.cashierId,
      userId,
    );
    this.orderGateway.emitOrderRefresh(
      order.operatorId,
      order.cashierId,
      userId,
    );
    return orderUpdated;
  }

  async updateOrder(id: string, dto: CreateOrderDto, user: AuthUser) {
    const order = await this.findOrderByIdWithSelect(id, {
      status: true,
      cashierId: true,
      operatorId: true,
      totalPrice: true,
      clientId: true,
      client: {
        select: {
          dni: true,
        },
      },
    });

    if (order.status === OrderStatus.Completed) {
      throw new Error('No se puede actualizar una orden completada');
    }

    const clientId = await this.clientService.resolveClientByDni(
      dto,
      order.clientId,
      order.client.dni,
      user.shopId,
    );

    const totalPrice = dto.treatments.reduce(
      (sum, treatment) => sum + treatment.price,
      0,
    );

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        totalPrice: totalPrice,
        client: { connect: { id: clientId } },
        ...(dto.stylistId && {
          stylist: { connect: { id: dto.stylistId } },
        }),
        ...(dto.cashierId && {
          cashier: { connect: { id: dto.cashierId } },
        }),
        treatments: {
          deleteMany: {},
          create: dto.treatments.map((treatment) => ({
            treatment: { connect: { id: treatment.treatmentId } },
            price: treatment.price,
          })),
        },
      },
      include: {
        treatments: true,
      },
    });
    this.orderGateway.emitOrderRefresh(
      updatedOrder.operatorId,
      updatedOrder.cashierId,
      user.id,
    );
    await this.notificationService.assignCashierNotification(dto.cashierId);
    return updatedOrder;
  }

  async getOrderById(id: string) {
    return await this.findOrderByIdWithSelect(id, {
      id: true,
      createdAt: true,
      orderNumber: true,
      totalPrice: true,
      paidAmount: true,
      paymentMethod: true,
      ticketNumber: true,
      status: true,
      treatments: {
        select: {
          treatment: {
            select: {
              id: true,
              name: true,
            },
          },
          price: true,
        },
      },
      cashier: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      stylist: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      client: {
        select: {
          id: true,
          name: true,
          dni: true,
          phone: true,
          email: true,
        },
      },
    });
  }

  async getPendingOrdersForUser(
    user: { id: string; rol: Role },
    statuses: OrderStatus[],
  ) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const whereClause =
      user.rol === Role.Cashier
        ? {
            cashierId: user.id,
            status: { in: statuses },
            createdAt: { gte: startOfDay, lte: endOfDay },
          }
        : user.rol === Role.Operator
          ? {
              operatorId: user.id,
              status: { in: statuses },
              createdAt: { gte: startOfDay, lte: endOfDay },
            }
          : {
              OR: [{ cashierId: user.id }, { operatorId: user.id }],
              status: { in: statuses },
              createdAt: { gte: startOfDay, lte: endOfDay },
            };

    return this.prisma.order.findMany({
      where: whereClause,
      select: {
        id: true,
        createdAt: true,
        orderNumber: true,
        totalPrice: true,
        stylist: {
          select: {
            id: true,
            firstName: true,
          },
        },
        client: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
