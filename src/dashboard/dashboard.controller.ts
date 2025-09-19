import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';
import { DashboardService } from './dashboard.service';
import { AuthUser } from 'src/auth/models/auth-user';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getDashboardStats(@Req() req: Request) {
    const user = req.user as AuthUser;
    return await this.dashboardService.getSimpleStats(user.shopId);
  }
}
