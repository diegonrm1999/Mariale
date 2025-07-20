import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderStatus, Role } from '@prisma/client';
import { OrdersGateway } from './orders.gateway';
import { CompleteOrderDto } from './dto/complete-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private readonly orderGateway: OrdersGateway,
  ) {}

  async createOrder(dto: CreateOrderDto, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== Role.Operator) {
      throw new Error('Solo operadores pueden crear órdenes');
    }

    if (!dto.treatmentId || !dto.stylistId || !dto.cashierId) {
      throw new Error('Faltan datos obligatorios para crear la orden');
    }

    const treatment = await this.prisma.treatment.findUnique({
      where: { id: dto.treatmentId },
    });

    if (!treatment) {
      throw new Error('Servicio no encontrado');
    }

    let clientId: string | null = null;
    if (dto.clientDni) {
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

      clientId = client.id;
    } else {
      throw new Error('DNI del cliente es obligatorio para crear la orden');
    }

    const createdOrder = this.prisma.order.create({
      data: {
        stylistId: dto.stylistId,
        cashierId: dto.cashierId,
        clientId: clientId,
        treatmentId: treatment.id,
        operatorId: userId,
        price: dto.price,
      },
    });
    this.orderGateway.emitOrderCreated(createdOrder);
    return createdOrder;
  }

  async completeOrder(id: string, dto: CompleteOrderDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status === 'Completed') {
      throw new Error('Order is already completed');
    }

    return this.prisma.order.update({
      where: { id },
      data: {
        paidAmount: dto.paidAmount,
        paymentMethod: dto.paymentMethod,
        status: 'Completed',
        ticketNumber: dto.ticketNumber,
      },
    });
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

    return this.prisma.order.update({
      where: { id },
      data: {
        client: { connect: { id: clientIdToUse } },
        ...(dto.treatmentId && {
          treatment: { connect: { id: dto.treatmentId } },
        }),
        ...(dto.stylistId && {
          stylist: { connect: { id: dto.stylistId } },
        }),
        ...(dto.cashierId && {
          cashier: { connect: { id: dto.cashierId } },
        }),
        price: dto.price,
      },
    });
  }

  async getOrderById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        treatment: true,
        client: true,
        stylist: true,
        cashier: true,
      },
    });

    if (!order) return null;

    return {
      ...order,
      stylist: {
        id: order.stylist.id,
        email: order.stylist.email,
        role: order.stylist.role,
        firstName: order.stylist.firstName,
        lastName: order.stylist.lastName,
      },
      cashier: {
        id: order.cashierId,
        email: order.cashier.email,
        role: order.cashier.role,
        firstName: order.cashier.firstName,
        lastName: order.cashier.lastName,
      },
    };
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
        price: true,
        orderNumber: true,
        treatment: {
          select: {
            id: true,
            name: true,
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
        clientId: true,
        client: {
          select: {
            id: true,
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
