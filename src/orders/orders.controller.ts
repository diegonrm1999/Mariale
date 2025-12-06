import {
  Body,
  Controller,
  Get,
  Patch,
  Param,
  Post,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';
import { Request } from 'express';
import { OrderStatus, Role } from '@prisma/client';
import { CompleteOrderDto } from './dto/complete-order.dto';
import { AuthUser } from 'src/auth/models/auth-user';
import { GetOrdersDto } from './dto/get-order-paginate.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateOrderDto, @Req() req: Request) {
    const user = req.user as AuthUser;
    return this.ordersService.createOrder(dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('active')
  async getPendingOrders(@Req() req: Request) {
    const user = req.user as { id: string; rol: Role };
    return this.ordersService.getPendingOrdersForUser(user, [
      OrderStatus.Created,
    ]);
  }

  @UseGuards(JwtAuthGuard)
  @Get('completed')
  async getCompletedOrders(@Req() req: Request) {
    const user = req.user as { id: string; rol: Role };
    return this.ordersService.getPendingOrdersForUser(user, [
      OrderStatus.Completed,
    ]);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getOrder(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/complete')
  async completeOrder(
    @Param('id') id: string,
    @Body() dto: CompleteOrderDto,
    @Req() req: Request,
  ) {
    const user = req.user as AuthUser;
    return this.ordersService.completeOrder(id, dto, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/cancel')
  async cancelOrder(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as AuthUser;
    return this.ordersService.cancelOrder(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateOrder(
    @Param('id') id: string,
    @Body() dto: CreateOrderDto,
    @Req() req: Request,
  ) {
    const user = req.user as AuthUser;
    return this.ordersService.updateOrder(id, dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/restore')
  restoreOrder(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as AuthUser;
    return this.ordersService.restoreOrder(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getOrders(@Req() req: Request, @Query() query: GetOrdersDto) {
    const user = req.user as AuthUser;
    return this.ordersService.getOrders(user.shopId, query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('summary/daily')
  async getDailySummary(@Req() req: Request, @Query('date') date?: string) {
    const user = req.user as { id: string; rol: Role };
    return this.ordersService.getDailySummary(
      user,
      date ?? new Date().toISOString().split('T')[0],
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/send-receipt')
  async sendOrderReceipt(@Param('id') id: string) {
    return await this.ordersService.sendOrderReceipt(id);
  }
}
