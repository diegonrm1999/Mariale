import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderStatus, Role } from '@prisma/client';
import { OrdersGateway } from './orders.gateway';
import { CompleteOrderDto } from './dto/complete-order.dto';
import { FcmService } from 'src/fcm/fcm.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private readonly orderGateway: OrdersGateway,
    private readonly fcmService: FcmService,
  ) {}

  private async sendOrderCreatedNotification(
    dto: CreateOrderDto,
    orderId: string,
  ) {
    try {
      await this.fcmService.sendToTopic(
        `cashier_${dto.cashierId}`,
        'Nueva orden creada',
        'Tienes una nueva orden para completar',
        {
          orderId: orderId,
          type: 'new_order',
        },
      );
    } catch (err) {
      console.error('Error enviando notificación FCM:', err);
    }
  }

  async createOrder(dto: CreateOrderDto, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || (user.role !== Role.Operator && user.role !== Role.Manager)) {
      throw new Error('No tienes permisos para crear órdenes');
    }

    const treatmentIds = dto.treatments.map((t) => t.treatmentId);

    const treatments = await this.prisma.treatment.findMany({
      where: { id: { in: treatmentIds } },
    });

    if (treatments.length !== treatmentIds.length) {
      throw new Error('Uno o más tratamientos no fueron encontrados');
    }

    let client = await this.prisma.client.findUnique({
      where: { dni: dto.clientDni },
    });

    if (!client) {
      client = await this.prisma.client.create({
        data: {
          dni: dto.clientDni,
          name: dto.clientName,
          phone: dto.clientPhone,
          email: dto.clientEmail,
        },
      });
    }

    const totalPrice = dto.treatments.reduce(
      (sum, treatment) => sum + treatment.price,
      0,
    );

    const createdOrder = await this.prisma.order.create({
      data: {
        stylistId: dto.stylistId,
        cashierId: dto.cashierId,
        clientId: client.id,
        operatorId: userId,
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
    this.orderGateway.emitOrderRefresh(userId);
    await this.sendOrderCreatedNotification(dto, createdOrder.id);
    return createdOrder;
  }

  async restoreOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.Completed) {
      throw new BadRequestException('Only completed orders can be restored');
    }

    const restoredOrder = this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.Created,
      },
    });
    
    this.orderGateway.completeRefresh(order.operatorId);
    return restoredOrder;
  }

  async completeOrder(id: string, dto: CompleteOrderDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw new Error('Order no encontrada');
    }

    if (order.status === 'Completed') {
      throw new Error('Orden ya está completada');
    }

    if (dto.paidAmount < order.totalPrice) {
      throw new Error('Pago insuficiente para completar la orden');
    }

    const orderUpdated = this.prisma.order.update({
      where: { id },
      data: {
        paidAmount: dto.paidAmount,
        paymentMethod: dto.paymentMethod,
        status: 'Completed',
        ticketNumber: dto.ticketNumber,
      },
    });

    this.orderGateway.completeRefresh(order.operatorId);
    return orderUpdated;
  }

  async updateOrderById(id: string, dto: CreateOrderDto) {
    const existing = await this.prisma.order.findUnique({
      where: { id },
      include: { client: true },
    });
    if (!existing) {
      throw new Error(`Order with ID ${id} not found`);
    }
    if (existing.status === OrderStatus.Completed) {
      throw new Error('Cannot update a completed order');
    }
    const isSameDni = dto.clientDni === existing.client.dni;
    let clientIdToUse = existing.clientId;
    if (isSameDni) {
      await this.prisma.client.update({
        where: { id: existing.clientId },
        data: {
          name: dto.clientName,
          phone: dto.clientPhone,
          email: dto.clientEmail,
        },
      });
    } else {
      const existingClient = await this.prisma.client.findUnique({
        where: { dni: dto.clientDni },
      });
      if (existingClient) {
        await this.prisma.client.update({
          where: { id: existingClient.id },
          data: {
            name: dto.clientName,
            phone: dto.clientPhone,
            email: dto.clientEmail,
          },
        });
        clientIdToUse = existingClient.id;
      } else {
        const newClient = await this.prisma.client.create({
          data: {
            dni: dto.clientDni,
            name: dto.clientName,
            phone: dto.clientPhone,
            email: dto.clientEmail,
          },
        });
        clientIdToUse = newClient.id;
      }
    }

    const totalPrice = dto.treatments.reduce(
      (sum, treatment) => sum + treatment.price,
      0,
    );

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        totalPrice: totalPrice,
        client: { connect: { id: clientIdToUse } },
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
    this.orderGateway.emitOrderRefresh(updatedOrder.operatorId);
    return updatedOrder;
  }

  async getOrderById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select: {
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
      },
    });
    if (!order) return null;
    return order;
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
        : {
            operatorId: user.id,
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
