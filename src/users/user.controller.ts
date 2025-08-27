import { Controller, Post, Body, Get, UseGuards, Patch, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class Usercontroller {
  constructor(private readonly userService: UsersService) {}

  @Get('stylists')
  async getStylists() {
    return this.userService.findStylists();
  }

  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.userService.updateUser(id, dto);
  }

  @Get('cashiers')
  async getCashiers() {
    return this.userService.findCashiers();
  }
}
