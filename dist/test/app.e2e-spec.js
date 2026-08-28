"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const request = require("supertest");
const app_module_1 = require("../src/app.module");
const prisma_service_1 = require("../src/prisma/prisma.service");
const http_exception_filter_1 = require("../src/common/filters/http-exception.filter");
const jwt_1 = require("@nestjs/jwt");
const client_1 = require("@prisma/client");
const qr_engine_util_1 = require("../src/common/utils/qr-engine.util");
describe('Application E2E & Integration Tests (Phase 4 Full Workflow)', () => {
    let app;
    let mockPrisma;
    let jwtService;
    let pesertaToken;
    let bendaharaToken;
    let adminToken;
    const salt = process.env.QR_SECRET_SALT || 'dev_qr_secret_salt_fallback_key_32_bytes';
    const regId = 'reg-e2e-100';
    const regNumber = 'REG-IND-2026-E2E100';
    const validQrToken = qr_engine_util_1.QrEngineUtil.generateToken(regId, regNumber, salt);
    const validPngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    ]);
    let currentRegStatus = client_1.RegistrationStatus.WAITING_VERIFICATION;
    let currentPayStatus = client_1.PaymentStatus.WAITING_VERIFICATION;
    let currentCheckInRecord = null;
    beforeAll(async () => {
        mockPrisma = {
            isHealthy: jest.fn().mockResolvedValue(true),
            $connect: jest.fn().mockResolvedValue(undefined),
            $disconnect: jest.fn().mockResolvedValue(undefined),
            user: {
                findUnique: jest.fn(),
                create: jest.fn(),
            },
            competitionCategory: {
                findMany: jest.fn().mockResolvedValue([
                    {
                        id: 'cat-1',
                        name: 'Robotika',
                        slug: 'robotika',
                        isActive: true,
                        levels: [],
                    },
                ]),
                findUnique: jest.fn(),
            },
            competitionBranch: {
                findUnique: jest.fn().mockResolvedValue({
                    id: 'br-indiv',
                    name: 'Tahfidz Juz 30',
                    participantType: client_1.ParticipantType.INDIVIDUAL,
                    registrationFee: 150000,
                    isActive: true,
                    level: { category: { name: 'Tahfidz' } },
                }),
            },
            paymentAccount: {
                findMany: jest.fn().mockResolvedValue([
                    { id: 'acc-bsi', bankName: 'BSI', accountNumber: '12345', accountHolder: 'Panitia', isActive: true },
                ]),
                findUnique: jest.fn().mockResolvedValue({
                    id: 'acc-bsi',
                    bankName: 'BSI',
                    accountNumber: '12345',
                    accountHolder: 'Panitia',
                    isActive: true,
                }),
            },
            registration: {
                findMany: jest.fn().mockResolvedValue([]),
                findFirst: jest.fn().mockImplementation(() => {
                    return Promise.resolve({
                        id: regId,
                        registrationNumber: regNumber,
                        qrCodeToken: validQrToken,
                        status: currentRegStatus,
                        userId: 'peserta-uuid-1',
                        checkIn: currentCheckInRecord,
                        branch: {
                            name: 'Tahfidz Juz 30',
                            participantType: client_1.ParticipantType.INDIVIDUAL,
                            registrationFee: 150000,
                            level: { name: 'SD/MI', category: { name: 'Tahfidz' } },
                        },
                        individualParticipant: { fullName: 'Ahmad Fauzi', schoolName: 'SD Al-Azhar' },
                        team: null,
                    });
                }),
                findUnique: jest.fn().mockImplementation((args) => {
                    return Promise.resolve({
                        id: args.where.id,
                        registrationNumber: regNumber,
                        qrCodeToken: validQrToken,
                        status: currentRegStatus,
                        userId: 'peserta-uuid-1',
                        checkIn: currentCheckInRecord,
                        branch: {
                            name: 'Tahfidz Juz 30',
                            participantType: client_1.ParticipantType.INDIVIDUAL,
                            registrationFee: 150000,
                            level: { name: 'SD/MI', category: { name: 'Tahfidz' } },
                        },
                        individualParticipant: { fullName: 'Ahmad Fauzi', schoolName: 'SD Al-Azhar' },
                        team: null,
                    });
                }),
                update: jest.fn().mockImplementation((args) => {
                    currentRegStatus = args.data.status;
                    return Promise.resolve({ id: regId, status: currentRegStatus });
                }),
            },
            payment: {
                create: jest.fn().mockResolvedValue({
                    id: 'pay-1',
                    registrationId: regId,
                    amount: 150000,
                    status: client_1.PaymentStatus.WAITING_VERIFICATION,
                }),
                findUnique: jest.fn().mockImplementation((args) => {
                    return Promise.resolve({
                        id: args.where.id,
                        registrationId: regId,
                        status: currentPayStatus,
                        registration: { registrationNumber: regNumber },
                    });
                }),
                findMany: jest.fn().mockResolvedValue([]),
                count: jest.fn().mockResolvedValue(1),
                update: jest.fn().mockImplementation((args) => {
                    currentPayStatus = args.data.status;
                    return Promise.resolve({ id: 'pay-1', status: currentPayStatus });
                }),
            },
            paymentVerificationLog: {
                create: jest.fn().mockResolvedValue({ id: 'log-1' }),
            },
            checkIn: {
                create: jest.fn().mockImplementation((args) => {
                    currentCheckInRecord = {
                        id: 'checkin-rec-1',
                        checkInTime: new Date('2026-08-27T08:00:00Z'),
                        checkInMethod: args.data.checkInMethod,
                        checkedInBy: { name: 'Bendahara Utama' },
                    };
                    return Promise.resolve(currentCheckInRecord);
                }),
                findMany: jest.fn().mockResolvedValue([
                    {
                        id: 'checkin-rec-1',
                        checkInTime: new Date('2026-08-27T08:00:00Z'),
                        checkInMethod: client_1.CheckInMethod.QR_SCAN,
                        checkedInBy: { name: 'Bendahara Utama' },
                        registration: {
                            registrationNumber: regNumber,
                            branch: { name: 'Tahfidz' },
                            individualParticipant: { fullName: 'Ahmad Fauzi', schoolName: 'SD Al-Azhar' },
                        },
                    },
                ]),
            },
            appSetting: {
                findMany: jest.fn().mockResolvedValue([
                    { key: 'application_name', value: 'SISTEM PENDAFTARAN LOMBA' },
                ]),
            },
            auditLog: {
                create: jest.fn().mockResolvedValue({}),
            },
            $transaction: jest.fn().mockImplementation(async (cb) => {
                return cb(mockPrisma);
            }),
        };
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        })
            .overrideProvider(prisma_service_1.PrismaService)
            .useValue(mockPrisma)
            .compile();
        app = moduleFixture.createNestApplication();
        jwtService = moduleFixture.get(jwt_1.JwtService);
        app.setGlobalPrefix('api', {
            exclude: ['health'],
        });
        app.useGlobalPipes(new common_1.ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }));
        app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
        await app.init();
        mockPrisma.user.findUnique.mockImplementation((args) => {
            if (args.where.id === 'peserta-uuid-1') {
                return Promise.resolve({
                    id: 'peserta-uuid-1',
                    name: 'Ahmad Fauzi',
                    email: 'peserta@lomba.id',
                    role: client_1.Role.PESERTA,
                    isActive: true,
                    sessionVersion: 1,
                });
            }
            if (args.where.id === 'bendahara-uuid-1') {
                return Promise.resolve({
                    id: 'bendahara-uuid-1',
                    name: 'Bendahara Utama',
                    email: 'bendahara@lomba.id',
                    role: client_1.Role.BENDAHARA,
                    isActive: true,
                    sessionVersion: 1,
                });
            }
            if (args.where.id === 'admin-uuid-1') {
                return Promise.resolve({
                    id: 'admin-uuid-1',
                    name: 'Admin Utama',
                    email: 'admin@lomba.id',
                    role: client_1.Role.SUPER_ADMIN,
                    isActive: true,
                    sessionVersion: 1,
                });
            }
            return Promise.resolve(null);
        });
        pesertaToken = jwtService.sign({
            sub: 'peserta-uuid-1',
            email: 'peserta@lomba.id',
            role: client_1.Role.PESERTA,
            sessionVersion: 1,
        });
        bendaharaToken = jwtService.sign({
            sub: 'bendahara-uuid-1',
            email: 'bendahara@lomba.id',
            role: client_1.Role.BENDAHARA,
            sessionVersion: 1,
        });
        adminToken = jwtService.sign({
            sub: 'admin-uuid-1',
            email: 'admin@lomba.id',
            role: client_1.Role.SUPER_ADMIN,
            sessionVersion: 1,
        });
    });
    afterAll(async () => {
        await app.close();
    });
    describe('End-to-End Operational Lifecycle', () => {
        it('1. Participant uploads payment proof', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/payments/upload')
                .set('Authorization', `Bearer ${pesertaToken}`)
                .field('registrationId', regId)
                .field('paymentAccountId', 'acc-bsi')
                .field('paymentDate', '2026-08-27')
                .field('senderBank', 'BSI')
                .field('senderAccountName', 'Ahmad')
                .attach('payment_proof', validPngBuffer, 'bukti.png')
                .expect(201);
            expect(response.body.success).toBe(true);
        });
        it('2. Bendahara rejects payment with mandatory reason', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/payments/pay-1/reject')
                .set('Authorization', `Bearer ${bendaharaToken}`)
                .send({ rejectionReason: 'Foto bukti buram dan tidak terbaca' })
                .expect(201);
            expect(response.body.success).toBe(true);
            expect(currentRegStatus).toBe(client_1.RegistrationStatus.PAYMENT_REJECTED);
        });
        it('3. Participant cannot access card while payment is rejected', async () => {
            await request(app.getHttpServer())
                .get(`/api/cards/${regId}`)
                .set('Authorization', `Bearer ${pesertaToken}`)
                .expect(400);
        });
        it('4. Participant re-uploads replacement payment proof', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/payments/reupload')
                .set('Authorization', `Bearer ${pesertaToken}`)
                .field('registrationId', regId)
                .field('paymentAccountId', 'acc-bsi')
                .field('paymentDate', '2026-08-27')
                .field('senderBank', 'BSI')
                .field('senderAccountName', 'Ahmad')
                .attach('payment_proof', validPngBuffer, 'bukti_jelas.png')
                .expect(201);
            expect(response.body.success).toBe(true);
            expect(currentRegStatus).toBe(client_1.RegistrationStatus.WAITING_VERIFICATION);
        });
        it('5. Bendahara approves payment proof', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/payments/pay-1/approve')
                .set('Authorization', `Bearer ${bendaharaToken}`)
                .expect(201);
            expect(response.body.success).toBe(true);
            expect(currentRegStatus).toBe(client_1.RegistrationStatus.APPROVED);
        });
        it('6. Participant card & QR code becomes available after approval', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/cards/${regId}`)
                .set('Authorization', `Bearer ${pesertaToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.registration_number).toBe(regNumber);
            expect(response.body.data.qr_data_uri).toBeDefined();
        });
        it('7. Staff performs QR Check-in successfully', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/checkin/scan')
                .set('Authorization', `Bearer ${bendaharaToken}`)
                .send({
                token: validQrToken,
                method: client_1.CheckInMethod.QR_SCAN,
            })
                .expect(201);
            expect(response.body.success).toBe(true);
            expect(response.body.already_checked_in).toBe(false);
        });
        it('8. Duplicate scan is rejected with previous check-in details', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/checkin/scan')
                .set('Authorization', `Bearer ${bendaharaToken}`)
                .send({
                token: validQrToken,
                method: client_1.CheckInMethod.QR_SCAN,
            })
                .expect(201);
            expect(response.body.success).toBe(false);
            expect(response.body.already_checked_in).toBe(true);
            expect(response.body.message).toContain('sudah pernah melakukan check-in');
        });
        it('9. Staff retrieves Live Check-In Log', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/checkin/live-log')
                .set('Authorization', `Bearer ${bendaharaToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
        });
    });
});
//# sourceMappingURL=app.e2e-spec.js.map