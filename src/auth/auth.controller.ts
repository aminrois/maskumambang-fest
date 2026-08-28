import { Controller, Post, Body, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from '../common/decorators/public.decorator';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const user = await this.authService.register(dto);
    return {
      success: true,
      message: 'Pendaftaran akun berhasil! Silakan login untuk melanjutkan.',
      data: user,
    };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const result = await this.authService.login(dto, ip, userAgent);
    return {
      success: true,
      message: 'Login berhasil.',
      data: result,
    };
  }
}
