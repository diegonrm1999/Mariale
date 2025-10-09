import { Controller, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.authService.validateUser(body.email, body.password);
    return await this.authService.login(user);
  }

  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    const isProduction = process.env.NODE_ENV === 'production';

    const cookieOptions: any = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      domain: isProduction ? '.dukarmo.com' : 'localhost',
      maxAge: 0,
    };

    res.cookie('token', '', cookieOptions);

    return { success: true, message: 'Logged out successfully' };
  }

  @Post('login/admin')
  async loginAdmin(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateUser(body.email, body.password);
    const loginResponse = await this.authService.loginAdmin(user);

    const isProduction = process.env.NODE_ENV === 'production';

    const cookieOptions: any = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 2,
      domain: isProduction ? '.dukarmo.com' : 'localhost',
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
}
