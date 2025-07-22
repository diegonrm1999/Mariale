import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new UnauthorizedException('Contraseña incorrecta');
    return user;
  }

  async login(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      rol: user.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
      role: user.role,
      id: user.id,
      name: user.firstName,
    };
  }
}
