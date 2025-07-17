import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { User } from './user.model';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(dto: CreateUserDto) {
    var hashedPassword = null;
    if (dto.password) {
      hashedPassword = await bcrypt.hash(dto.password, 10);
    }
    const created = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        role: dto.role,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
    });

    return User.fromPrisma(created);
  }

  async findStylists() {
    return this.prisma.user.findMany({
      where: { role: Role.Stylist },
    });
  }

  async findCashiers() {
    return this.prisma.user.findMany({
      where: { role: Role.Cashier },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
}
