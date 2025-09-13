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
import { AuthGuard } from '@nestjs/passport';
import { OrdersService } from './orders.service';
import { Request } from 'express';
import { OrderStatus, Role } from '@prisma/client';
import { CompleteOrderDto } from './dto/complete-order.dto';
import { AuthUser } from 'src/auth/models/auth-user';
import { GetOrdersDto } from './dto/get-order-paginate.dto';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Body() dto: CreateOrderDto, @Req() req: Request) {
    const user = req.user as AuthUser;
    return this.ordersService.createOrder(dto, user);
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
    @Req() req: Request,
  ) {
    const user = req.user as AuthUser;
    return this.ordersService.completeOrder(id, dto, user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  async updateOrder(
    @Param('id') id: string,
    @Body() dto: CreateOrderDto,
    @Req() req: Request,
  ) {
    const user = req.user as AuthUser;
    return this.ordersService.updateOrder(id, dto, user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/restore')
  restoreOrder(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as AuthUser;
    return this.ordersService.restoreOrder(id, user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getOrders(@Req() req: Request, @Query() query: GetOrdersDto) {
    const user = req.user as AuthUser;
    return this.ordersService.getOrders(user.shopId, query);
  }
}
