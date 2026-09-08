import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RecaptchaService } from './recaptcha.service';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly auditService;
    private readonly recaptchaService;
    constructor(prisma: PrismaService, jwtService: JwtService, auditService: AuditService, recaptchaService: RecaptchaService);
    register(dto: RegisterDto, remoteIp?: string): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            name: string;
            phoneNumber: string;
            role: import(".prisma/client").$Enums.Role;
            isActive: boolean;
            sessionVersion: number;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            name: string;
            phoneNumber: string;
            role: import(".prisma/client").$Enums.Role;
            isActive: boolean;
            sessionVersion: number;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
}
