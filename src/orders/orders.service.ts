import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderStatus, Role } from '@prisma/client';
import { UpdateOrderDto } from './dto/update_order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

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
          },
        });
      }

      clientId = client.id;
    } else {
      let newClient = await this.prisma.client.create({
        data: {
          name: dto.clientName,
          phone: dto.clientPhone,
        },
      });

      clientId = newClient.id;
    }

    return this.prisma.order.create({
      data: {
        stylistId: dto.stylistId,
        cashierId: dto.cashierId,
        clientId: clientId,
        treatmentId: treatment.id,
        operatorId: userId,
      },
    });
  }

  async updateOrderById(id: string, dto: UpdateOrderDto) {
    const existing = await this.prisma.order.findUnique({ where: { id } });

    if (!existing) {
      throw new Error(`Order with ID ${id} not found`);
    }
    console.log('Updating client information for order', dto.clientId);
    if (dto.clientId && (dto.clientName || dto.clientPhone || dto.clientDni)) {
      console.log('Updating client information for order', id);
      await this.prisma.client.update({
        where: { id: dto.clientId },
        data: {
          name: dto.clientName ?? undefined,
          phone: dto.clientPhone ?? undefined,
          dni: dto.clientDni ?? undefined,
        },
      });
    }
    console.log('Updating order with ID:', id, 'with data:', dto);
    return this.prisma.order.update({
      where: { id },
      data: {
        ...(dto.treatmentId && {
          treatment: { connect: { id: dto.treatmentId } },
        }),
        ...(dto.stylistId && {
          stylist: { connect: { id: dto.stylistId } },
        }),
        ...(dto.cashierId && {
          cashier: { connect: { id: dto.cashierId } },
        }),
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

  async getPendingOrdersForUser(user: { id: string; rol: Role }) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const whereClause =
      user.rol === Role.Cashier
        ? {
            cashierId: user.id,
            status: { not: OrderStatus.Completed },
            createdAt: { gte: startOfDay, lte: endOfDay },
          }
        : {
            operatorId: user.id,
            status: { not: OrderStatus.Completed },
            createdAt: { gte: startOfDay, lte: endOfDay },
          };

    return this.prisma.order.findMany({
      where: whereClause,
      select: {
        id: true,
        createdAt: true,
        treatment: {
          select: {
            id: true,
            name: true,
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
