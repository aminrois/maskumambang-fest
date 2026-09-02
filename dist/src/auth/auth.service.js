"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const hash_util_1 = require("../common/utils/hash.util");
const client_1 = require("@prisma/client");
let AuthService = class AuthService {
    constructor(prisma, jwtService, auditService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.auditService = auditService;
    }
    async register(dto) {
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email.trim().toLowerCase() },
        });
        if (existing) {
            throw new common_1.ConflictException('Email ini sudah terdaftar dalam sistem.');
        }
        const passwordHash = await hash_util_1.HashUtil.hashPassword(dto.password);
        const newUser = await this.prisma.user.create({
            data: {
                name: dto.name.trim(),
                email: dto.email.trim().toLowerCase(),
                phoneNumber: dto.phoneNumber.trim(),
                passwordHash,
                role: client_1.Role.PESERTA,
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
    async login(dto, ipAddress, userAgent) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email.trim().toLowerCase() },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Email atau kata sandi tidak valid.');
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Akun Anda dinonaktifkan. Hubungi panitia.');
        }
        const isMatch = await hash_util_1.HashUtil.verifyPassword(dto.password, user.passwordHash);
        if (!isMatch) {
            throw new common_1.UnauthorizedException('Email atau kata sandi tidak valid.');
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        audit_service_1.AuditService])
], AuthService);
//# sourceMappingURL=auth.service.js.map