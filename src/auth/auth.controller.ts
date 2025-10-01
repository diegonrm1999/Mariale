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

    const cookieOptions: any = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 2,
    };

    res.cookie('token', loginResponse.token, cookieOptions);

    return {
      ...loginResponse,
      debug: {
        isProduction,
        cookiesSent: true,
        sameSite: cookieOptions.sameSite,
        secure: cookieOptions.secure,
      },
    };
  }

  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }
}
