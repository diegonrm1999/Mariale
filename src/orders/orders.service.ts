import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderStatus, PaymentMethod, Prisma, Role } from '@prisma/client';
import { OrdersGateway } from './orders.gateway';
import { CompleteOrderDto } from './dto/complete-order.dto';
import { NotificationService } from 'src/services/notification.service';
import { AuthUser } from 'src/auth/models/auth-user';
import { ClientsService } from 'src/client/clients.service';
import { UsersService } from 'src/users/users.service';
import { TreatmentsService } from 'src/treatments/treatments.service';
import { GetOrdersDto } from './dto/get-order-paginate.dto';
import { EmailService } from 'src/email/email.service';
import { OrderReceiptData } from 'src/email/dto/order-receipt.dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private readonly orderGateway: OrdersGateway,
    private readonly notificationService: NotificationService,
    private readonly clientService: ClientsService,
    private readonly userService: UsersService,
    private readonly treatmentService: TreatmentsService,
    private readonly emailService: EmailService,
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

  async cancelOrder(id: string, userId: string) {
    const order = await this.findOrderByIdWithSelect(id, {
      status: true,
      cashierId: true,
      operatorId: true,
      totalPrice: true,
    });

    if (order.status !== OrderStatus.Created) {
      throw new Error('Orden no se puede cancelar');
    }

    const orderUpdated = this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.Cancelled,
      },
    });
    this.orderGateway.emitOrderRefresh(
      order.operatorId,
      order.cashierId,
      userId,
    );
    return orderUpdated;
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

  async getOrders(shopId: string, filters: GetOrdersDto) {
    const { page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where = this.buildWhereClause(shopId, filters);

    const [orders, totalCount] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ createdAt: 'desc' }, { orderNumber: 'desc' }],
        select: {
          id: true,
          orderNumber: true,
          totalPrice: true,
          paidAmount: true,
          paymentMethod: true,
          status: true,
          ticketNumber: true,
          createdAt: true,
          updatedAt: true,
          client: {
            select: {
              id: true,
              name: true,
              dni: true,
              phone: true,
              email: true,
            },
          },
          stylist: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          operator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          cashier: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: { treatments: true },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
    };
  }

  async sendOrderReceipt(
    orderId: string,
  ): Promise<{ message: string; status: string }> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          client: true,
          shop: true,
          stylist: true,
          operator: true,
          cashier: true,
          treatments: {
            include: {
              treatment: true,
            },
          },
        },
      });

      if (!order) {
        throw new Error('Orden no encontrada');
      }
      this.validateOrderForReceipt(order);
      const receiptData = this.buildReceiptData(order);
      await this.emailService.sendOrderReceipt(receiptData);
      return {
        message: 'Recibo enviado exitosamente',
        status: 'success',
      };
    } catch (error) {
      throw Error('Error al enviar el recibo');
    }
  }

  private buildReceiptData(order: any): OrderReceiptData {
    return {
      orderNumber: order.orderNumber.toString(),
      ticketNumber: order.ticketNumber || '',
      clientName: 'Diego Narrea Mori',
      clientEmail: order.client.email,
      shopName: order.shop.name,
      shopAddress1: 'JR. UCAYALI # 724 - GALERIA BARRIO CHINO',
      shopAddress2: 'SEGUNDO PISO - # 207',
      shopAddress3: 'LIMA - LIMA - LIMA',
      shopPhone: '924151512',
      shopRuc: '20448100180',
      date: this.formatDate(order.createdAt),
      time: this.formatTime(order.createdAt),
      stylistName: 'Juana Sanchez',
      operatorName: `${order.operator.firstName} ${order.operator.lastName ?? ''}`,
      cashierName: 'Carlos Torres',
      treatments: order.treatments.map((orderTreatment) => ({
        name: orderTreatment.treatment.name,
        price: orderTreatment.price,
        quantity: 1,
      })),
      totalPrice: order.totalPrice,
      paidAmount: order.paidAmount || 0,
      paymentMethod: order.paymentMethod,
      currency: 'S/',
    };
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  private formatTime(date: Date): string {
    return new Intl.DateTimeFormat('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  }

  private validateOrderForReceipt(order: any): void {
    if (order.status !== OrderStatus.Completed) {
      throw new Error(
        `Solo se pueden enviar recibos de órdenes completadas. Estado actual: ${order.status}`,
      );
    }
    if (!order.client.email) {
      throw new Error(
        `El cliente "${order.client.name}" no tiene email registrado`,
      );
    }
  }

  private buildWhereClause(shopId: string, filters: GetOrdersDto) {
    const where: any = { shopId };

    if (filters.stylistId) where.stylistId = filters.stylistId;
    if (filters.operatorId) where.operatorId = filters.operatorId;
    if (filters.cashierId) where.cashierId = filters.cashierId;
    if (filters.status) where.status = filters.status;
    if (filters.orderNumber) where.orderNumber = filters.orderNumber;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setUTCHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }
    return where;
  }
}
