import { Controller, Post, Body, Req, Res, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Request, Response } from 'express';

const COOKIE_NAME = 'lomba_session';
const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8 jam dalam milliseconds

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);

    res.cookie(COOKIE_NAME, result.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    return {
      success: true,
      message: 'Pendaftaran akun berhasil!',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const result = await this.authService.login(dto, ip, userAgent);

    // Set HttpOnly cookie — session cookie (tanpa maxAge agar otomatis terhapus saat browser ditutup)
    // JWT token sendiri tetap dibatasi masa aktif maksimal 8 jam
    res.cookie(COOKIE_NAME, result.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    return {
      success: true,
      message: 'Login berhasil.',
      data: {
        user: result.user,
        // Tetap kirim token di body untuk kompatibilitas backward
        accessToken: result.accessToken,
      },
    };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(COOKIE_NAME, { path: '/' });
    return { success: true, message: 'Logout berhasil.' };
  }
}
