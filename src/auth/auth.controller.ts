import { Controller, Post, Body, Res, Req } from '@nestjs/common';
import { Response } from 'express';
import { Request } from 'express';
import { AuthService } from './auth.service';
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request, // ⭐ Agrega esto
  ) {
    const user = await this.authService.validateUser(body.email, body.password);
    const loginResponse = await this.authService.login(user);

    const isProduction = process.env.NODE_ENV === 'production';

    // ⭐ LOG para ver qué se está enviando
    console.log('=== LOGIN DEBUG ===');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('isProduction:', isProduction);
    console.log('Request origin:', req.headers.origin);
    console.log('Request host:', req.headers.host);

    const cookieOptions: any = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 2,
    };

    console.log('Cookie options:', cookieOptions);

    res.cookie('token', loginResponse.token, cookieOptions);
    res.cookie('refreshToken', loginResponse.refreshToken, {
      ...cookieOptions,
      maxAge: 1000 * 60 * 60 * 24 * 30 * 4,
    });

    // ⭐ Retorna info de debug
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
