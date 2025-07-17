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
import { Role } from '@prisma/client';
import { UpdateOrderDto } from './dto/update_order.dto';

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
    return this.ordersService.getPendingOrdersForUser(user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async getOrder(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }

  @Patch(':id')
  async updateOrderById(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.ordersService.updateOrderById(id, dto);
  }
}
