import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTreatmentDto } from './dto/create-treatment.dto';

@Injectable()
export class TreatmentsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateTreatmentDto) {
    return this.prisma.treatment.create({
      data: {
        name: dto.name,
        price: dto.price,
        percentage: dto.percentage,
      },
    });
  }

  findAll() {
    return this.prisma.treatment.findMany();
  }
}
