"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const payments_service_1 = require("./payments.service");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
describe('PaymentsService', () => {
    let service;
    let prisma;
    const mockPrisma = {
        paymentAccount: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        registration: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        payment: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            findFirst: jest.fn(),
            count: jest.fn(),
            update: jest.fn(),
        },
        paymentVerificationLog: {
            create: jest.fn(),
        },
        $transaction: jest.fn(),
    };
    const mockAudit = {
        log: jest.fn().mockResolvedValue(undefined),
    };
    const mockConfig = {
        get: jest.fn().mockImplementation((key) => {
            if (key === 'upload.folder')
                return 'uploads';
            return null;
        }),
    };
    const validPngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    ]);
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                payments_service_1.PaymentsService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrisma },
                { provide: audit_service_1.AuditService, useValue: mockAudit },
                { provide: config_1.ConfigService, useValue: mockConfig },
            ],
        }).compile();
        service = module.get(payments_service_1.PaymentsService);
        prisma = module.get(prisma_service_1.PrismaService);
    });
    describe('uploadPayment', () => {
        it('PAY-01 & PAY-02: should upload valid payment proof and set status to WAITING_VERIFICATION', async () => {
            mockPrisma.registration.findUnique.mockResolvedValue({
                id: 'reg-1',
                userId: 'user-1',
                registrationNumber: 'REG-IND-2026-ABC123',
                branch: { registrationFee: 150000 },
            });
            mockPrisma.paymentAccount.findUnique.mockResolvedValue({
                id: 'acc-1',
                bankName: 'BSI',
                isActive: true,
            });
            mockPrisma.$transaction.mockImplementation(async (cb) => {
                return cb({
                    payment: {
                        create: jest.fn().mockResolvedValue({
                            id: 'pay-1',
                            amount: 150000,
                            status: client_1.PaymentStatus.WAITING_VERIFICATION,
                        }),
                    },
                    registration: {
                        update: jest.fn().mockResolvedValue({}),
                    },
                });
            });
            const res = await service.uploadPayment('user-1', {
                registrationId: 'reg-1',
                paymentAccountId: 'acc-1',
                paymentDate: '2026-08-27',
                senderBank: 'BSI',
                senderAccountName: 'Ahmad',
            }, validPngBuffer, 'bukti.png');
            expect(res).toBeDefined();
            expect(res.amount).toBe(150000);
            expect(res.status).toBe(client_1.PaymentStatus.WAITING_VERIFICATION);
        });
        it('PAY-SEC-02: should reject upload if user is not the owner (IDOR check)', async () => {
            mockPrisma.registration.findUnique.mockResolvedValue({
                id: 'reg-1',
                userId: 'user-other',
            });
            await expect(service.uploadPayment('user-attacker', {
                registrationId: 'reg-1',
                paymentAccountId: 'acc-1',
                paymentDate: '2026-08-27',
            }, validPngBuffer, 'bukti.png')).rejects.toThrow(common_1.ForbiddenException);
        });
    });
    describe('approvePayment', () => {
        it('PAY-04 & PAY-05: Bendahara can approve payment atomically', async () => {
            mockPrisma.payment.findUnique.mockResolvedValue({
                id: 'pay-1',
                registrationId: 'reg-1',
                registration: { registrationNumber: 'REG-IND-2026-ABC123' },
            });
            mockPrisma.$transaction.mockImplementation(async (cb) => {
                return cb({
                    payment: {
                        update: jest.fn().mockResolvedValue({ id: 'pay-1', status: client_1.PaymentStatus.APPROVED }),
                    },
                    registration: {
                        update: jest.fn().mockResolvedValue({ id: 'reg-1', status: client_1.RegistrationStatus.APPROVED }),
                    },
                    paymentVerificationLog: {
                        create: jest.fn().mockResolvedValue({}),
                    },
                });
            });
            const res = await service.approvePayment('pay-1', 'bendahara-uuid');
            expect(res).toBeDefined();
            expect(res.status).toBe(client_1.PaymentStatus.APPROVED);
        });
    });
    describe('rejectPayment', () => {
        it('PAY-08 & PAY-09: Bendahara must provide rejection reason when rejecting payment', async () => {
            mockPrisma.payment.findUnique.mockResolvedValue({
                id: 'pay-1',
                registrationId: 'reg-1',
                registration: { registrationNumber: 'REG-IND-2026-ABC123' },
            });
            await expect(service.rejectPayment('pay-1', 'bendahara-uuid', { rejectionReason: '' })).rejects.toThrow(common_1.BadRequestException);
            mockPrisma.$transaction.mockImplementation(async (cb) => {
                return cb({
                    payment: {
                        update: jest.fn().mockResolvedValue({ id: 'pay-1', status: client_1.PaymentStatus.REJECTED }),
                    },
                    registration: {
                        update: jest.fn().mockResolvedValue({ id: 'reg-1', status: client_1.RegistrationStatus.PAYMENT_REJECTED }),
                    },
                    paymentVerificationLog: {
                        create: jest.fn().mockResolvedValue({}),
                    },
                });
            });
            const res = await service.rejectPayment('pay-1', 'bendahara-uuid', {
                rejectionReason: 'Nominal transfer kurang Rp 50.000',
            });
            expect(res.status).toBe(client_1.PaymentStatus.REJECTED);
        });
    });
});
//# sourceMappingURL=payments.service.spec.js.map