"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const auth_service_1 = require("./auth.service");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_1 = require("@nestjs/jwt");
const audit_service_1 = require("../audit/audit.service");
const common_1 = require("@nestjs/common");
const hash_util_1 = require("../common/utils/hash.util");
const client_1 = require("@prisma/client");
describe('AuthService', () => {
    let service;
    let prisma;
    const mockPrisma = {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
    };
    const mockJwt = {
        sign: jest.fn().mockReturnValue('mock_jwt_token'),
    };
    const mockAudit = {
        log: jest.fn().mockResolvedValue(undefined),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                auth_service_1.AuthService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrisma },
                { provide: jwt_1.JwtService, useValue: mockJwt },
                { provide: audit_service_1.AuditService, useValue: mockAudit },
            ],
        }).compile();
        service = module.get(auth_service_1.AuthService);
        prisma = module.get(prisma_service_1.PrismaService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('register', () => {
        it('should throw ConflictException if email exists', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'existing@lomba.id' });
            await expect(service.register({
                name: 'Test',
                email: 'existing@lomba.id',
                phoneNumber: '0812345',
                password: 'password123',
            })).rejects.toThrow(common_1.ConflictException);
        });
        it('should create new user and return safe user object', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            mockPrisma.user.create.mockResolvedValue({
                id: 'new-uuid',
                name: 'Ahmad Fauzi',
                email: 'ahmad@lomba.id',
                phoneNumber: '0812345678',
                passwordHash: 'hashed_password',
                role: client_1.Role.PESERTA,
                isActive: true,
            });
            const res = await service.register({
                name: 'Ahmad Fauzi',
                email: 'ahmad@lomba.id',
                phoneNumber: '0812345678',
                password: 'password123',
            });
            expect(res).toBeDefined();
            expect(res.email).toBe('ahmad@lomba.id');
            expect(res.passwordHash).toBeUndefined();
        });
    });
    describe('login', () => {
        it('should throw UnauthorizedException on invalid user', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            await expect(service.login({ email: 'notfound@lomba.id', password: 'password123' })).rejects.toThrow(common_1.UnauthorizedException);
        });
        it('should throw UnauthorizedException on inactive user', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({
                id: '1',
                email: 'inactive@lomba.id',
                isActive: false,
            });
            await expect(service.login({ email: 'inactive@lomba.id', password: 'password123' })).rejects.toThrow(common_1.UnauthorizedException);
        });
        it('should return accessToken on valid credentials', async () => {
            const hash = await hash_util_1.HashUtil.hashPassword('validpass123');
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'user-123',
                email: 'user@lomba.id',
                passwordHash: hash,
                role: client_1.Role.PESERTA,
                isActive: true,
                sessionVersion: 1,
            });
            const res = await service.login({ email: 'user@lomba.id', password: 'validpass123' });
            expect(res).toBeDefined();
            expect(res.accessToken).toBe('mock_jwt_token');
            expect(res.user.email).toBe('user@lomba.id');
            expect(res.user.passwordHash).toBeUndefined();
        });
    });
});
//# sourceMappingURL=auth.service.spec.js.map