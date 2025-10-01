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

    const isProduction = process.env.NODE_ENV === 'production';

    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 2,
    } as const;

    res.cookie('token', loginResponse.token, cookieOptions);

    res.cookie('refreshToken', loginResponse.refreshToken, {
      ...cookieOptions,
      maxAge: 1000 * 60 * 60 * 24 * 30 * 4,
    });

    return loginResponse;
  }

  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }
}
