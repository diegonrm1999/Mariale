import { Controller, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateUser(body.email, body.password);
    const loginResponse = await this.authService.login(user);
    res.cookie('token', loginResponse.token, {
      httpOnly: true,
      secure: true, 
      sameSite: 'none', 
      domain: '.dukarmo.com',
      maxAge: 1000 * 60 * 60 * 24 * 2,
    });
    res.cookie('refreshToken', loginResponse.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      domain: '.dukarmo.com',
      maxAge: 1000 * 60 * 60 * 24 * 30 * 4,
    });
    return loginResponse;
  }

  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }
}
