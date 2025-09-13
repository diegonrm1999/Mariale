import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShopDto } from './dto/create-shop';

@Injectable()
export class ShopService {
  constructor(private prisma: PrismaService) {}

  async createShop(dto: CreateShopDto) {
    return await this.prisma.shop.create({
      data: {
        name: dto.name,
      },
    });
  }

  async getShops() {
    return await this.prisma.shop.findMany({});
  }
}
