import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@Controller('users')
export class Usercontroller {
  constructor(private readonly userService: UsersService) {}

  @Get('stylists')
  async getStylists() {
    return this.userService.findStylists();
  }

  @Get('cashiers')
  async getCashiers() {
    return this.userService.findCashiers();
  }
}
