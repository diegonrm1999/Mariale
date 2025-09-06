import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Patch,
  Param,
} from '@nestjs/common';
import { TreatmentsService } from './treatments.service';
import { TreatmentDto } from './dto/treatment';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { AuthUser } from 'src/auth/models/auth-user';

@Controller('treatments')
export class TreatmentsController {
  constructor(private readonly treatmentsService: TreatmentsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body() dto: TreatmentDto, @Req() req: Request) {
    const user = req.user as AuthUser;
    return this.treatmentsService.create(dto, user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  async updateUser(@Param('id') id: string, @Body() dto: TreatmentDto) {
    return this.treatmentsService.update(id, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('all')
  findAll(@Req() req: Request) {
    const user = req.user as AuthUser;
    return this.treatmentsService.findAll(user);
  }
}
