import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { HashUtil } from '../common/utils/hash.util';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RecaptchaService } from './recaptcha.service';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
    private readonly recaptchaService: RecaptchaService,
  ) {}

  async register(dto: RegisterDto, remoteIp?: string) {
    await this.recaptchaService.verify(dto.recaptchaToken, remoteIp);

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Email ini sudah terdaftar dalam sistem.');
    }

    const passwordHash = await HashUtil.hashPassword(dto.password);

    const newUser = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email: dto.email.trim().toLowerCase(),
        phoneNumber: dto.phoneNumber.trim(),
        passwordHash,
        role: Role.PESERTA,
        isActive: true,
      },
    });

    await this.auditService.log({
      userId: newUser.id,
      action: 'USER_REGISTER',
      targetTable: 'users',
      targetId: newUser.id,
      details: `Pendaftaran akun peserta baru: ${newUser.email}`,
    });

    const payload = {
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
      sessionVersion: newUser.sessionVersion,
    };

    const accessToken = this.jwtService.sign(payload);

    const { passwordHash: _, ...safeUser } = newUser;
    return {
      accessToken,
      user: safeUser,
    };
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    await this.recaptchaService.verify(dto.recaptchaToken, ipAddress);

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Email atau kata sandi tidak valid.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Akun Anda dinonaktifkan. Hubungi panitia.');
    }

    const isMatch = await HashUtil.verifyPassword(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Email atau kata sandi tidak valid.');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionVersion: user.sessionVersion,
    };

    const accessToken = this.jwtService.sign(payload);

    await this.auditService.log({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      targetTable: 'users',
      targetId: user.id,
      details: `Login berhasil (${user.role})`,
      ipAddress,
      userAgent,
    });

    const { passwordHash: _, ...safeUser } = user;
    return {
      accessToken,
      user: safeUser,
    };
  }
}
