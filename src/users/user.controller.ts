import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Param,
  Req,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user';
import { UpdateUserDto } from './dto/update-user';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { AuthUser } from 'src/auth/models/auth-user';
import { GetUsersDto } from './dto/get-user.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('users')
export class Usercontroller {
  constructor(private readonly userService: UsersService) {}

  @Post('create')
  async createUser(@Body() dto: CreateUserDto) {
    return await this.userService.createUser(dto);
  }

  @Patch(':id')
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.updateUser(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('stylists')
  async getStylists(@Req() req: Request) {
    const user = req.user as AuthUser;
    return this.userService.findStylists(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('managers')
  async getManagers(@Req() req: Request) {
    const user = req.user as AuthUser;
    return this.userService.findManagers(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('operators')
  async getOperators(@Req() req: Request, @Query() query: GetUsersDto) {
    const user = req.user as AuthUser;
    return this.userService.findOperators(user, query.strict);
  }

  @UseGuards(JwtAuthGuard)
  @Get('cashiers')
  async getCashiers(@Req() req: Request, @Query() query: GetUsersDto) {
    const user = req.user as AuthUser;
    return this.userService.findCashiers(user, query.strict);
  }
}
