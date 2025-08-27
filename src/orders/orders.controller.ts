import {
  Body,
  Controller,
  Get,
  Patch,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { AuthGuard } from '@nestjs/passport';
import { OrdersService } from './orders.service';
import { Request } from 'express';
import { OrderStatus, Role } from '@prisma/client';
import { CompleteOrderDto } from './dto/complete-order.dto';


@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Body() dto: CreateOrderDto, @Req() req: any) {
    return this.ordersService.createOrder(dto, req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('active')
  async getPendingOrders(@Req() req: Request) {
    const user = req.user as { id: string; rol: Role };
    return this.ordersService.getPendingOrdersForUser(user, [
      OrderStatus.Created,
    ]);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('completed')
  async getCompletedOrders(@Req() req: Request) {
    const user = req.user as { id: string; rol: Role };
    return this.ordersService.getPendingOrdersForUser(user, [
      OrderStatus.Completed,
    ]);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async getOrder(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/complete')
  async completeOrder(
    @Param('id') id: string,
    @Body() dto: CompleteOrderDto,
    @Req() req: any,
  ) {
    return this.ordersService.completeOrder(id, dto, req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  async updateOrderById(
    @Param('id') id: string,
    @Body() dto: CreateOrderDto,
    @Req() req: any,
  ) {
    return this.ordersService.updateOrderById(id, dto, req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/restore')
  restoreOrder(@Param('id') id: string, @Req() req: any) {
    return this.ordersService.restoreOrder(id, req.user.id);
  }
}
