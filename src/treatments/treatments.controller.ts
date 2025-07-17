import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { TreatmentsService } from './treatments.service';
import { CreateTreatmentDto } from './dto/create-treatment.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('treatments')
export class TreatmentsController {
  constructor(private readonly treatmentsService: TreatmentsService) {}

  @Post()
  create(@Body() dto: CreateTreatmentDto) {
    return this.treatmentsService.create(dto);
  }

  @Get('all')
  findAll() {
    return this.treatmentsService.findAll();
  }
}
