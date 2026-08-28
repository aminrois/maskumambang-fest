"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const checkin_service_1 = require("./checkin.service");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const qr_engine_util_1 = require("../common/utils/qr-engine.util");
describe('CheckInService', () => {
    let service;
    let prisma;
    const salt = 'test_salt_12345';
    const regId = 'reg-uuid-1';
    const regNumber = 'REG-IND-2026-ABC123';
    const validQrToken = qr_engine_util_1.QrEngineUtil.generateToken(regId, regNumber, salt);
    const mockPrisma = {
        registration: {
            findFirst: jest.fn(),
        },
        checkIn: {
            create: jest.fn(),
            findMany: jest.fn(),
        },
    };
    const mockAudit = {
        log: jest.fn().mockResolvedValue(undefined),
    };
    const mockConfig = {
        get: jest.fn().mockImplementation((key) => {
            if (key === 'qr.salt')
                return salt;
            return null;
        }),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                checkin_service_1.CheckInService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrisma },
                { provide: audit_service_1.AuditService, useValue: mockAudit },
                { provide: config_1.ConfigService, useValue: mockConfig },
            ],
        }).compile();
        service = module.get(checkin_service_1.CheckInService);
        prisma = module.get(prisma_service_1.PrismaService);
    });
    it('CHECK-01: should process valid QR check-in successfully', async () => {
        mockPrisma.registration.findFirst.mockResolvedValue({
            id: regId,
            registrationNumber: regNumber,
            qrCodeToken: validQrToken,
            status: client_1.RegistrationStatus.APPROVED,
            checkIn: null,
            branch: {
                name: 'Tahfidz Juz 30',
                participantType: client_1.ParticipantType.INDIVIDUAL,
                level: {
                    name: 'SD/MI',
                    category: { name: 'Tahfidz' },
                },
            },
            individualParticipant: {
                fullName: 'Ahmad Fauzi',
                schoolName: 'SD Islam Al-Azhar',
            },
        });
        mockPrisma.checkIn.create.mockResolvedValue({
            id: 'checkin-1',
            registrationId: regId,
            checkInMethod: client_1.CheckInMethod.QR_SCAN,
            checkInTime: new Date('2026-08-27T08:00:00Z'),
            checkedInBy: { name: 'Petugas Meja 1' },
        });
        const res = await service.processCheckIn('staff-1', {
            token: validQrToken,
            method: client_1.CheckInMethod.QR_SCAN,
        });
        expect(res.success).toBe(true);
        expect(res.already_checked_in).toBe(false);
        expect(res.data?.registration_number).toBe(regNumber);
    });
    it('CHECK-02: should reject duplicate check-in scan and return previous operator details', async () => {
        mockPrisma.registration.findFirst.mockResolvedValue({
            id: regId,
            registrationNumber: regNumber,
            qrCodeToken: validQrToken,
            status: client_1.RegistrationStatus.APPROVED,
            checkIn: {
                id: 'checkin-1',
                checkInTime: new Date('2026-08-27T08:00:00Z'),
                checkedInBy: { name: 'Petugas Meja 1' },
            },
            branch: { name: 'Tahfidz' },
            individualParticipant: { fullName: 'Ahmad Fauzi' },
        });
        const res = await service.processCheckIn('staff-2', {
            token: validQrToken,
            method: client_1.CheckInMethod.QR_SCAN,
        });
        expect(res.success).toBe(false);
        expect(res.already_checked_in).toBe(true);
        expect(res.message).toContain('sudah pernah melakukan check-in');
        expect(res.previous_staff).toBe('Petugas Meja 1');
    });
    it('CHECK-03: should succeed with manual registration code', async () => {
        mockPrisma.registration.findFirst.mockResolvedValue({
            id: regId,
            registrationNumber: regNumber,
            status: client_1.RegistrationStatus.APPROVED,
            checkIn: null,
            branch: {
                name: 'Tahfidz Juz 30',
                participantType: client_1.ParticipantType.INDIVIDUAL,
                level: {
                    name: 'SD/MI',
                    category: { name: 'Tahfidz' },
                },
            },
            individualParticipant: {
                fullName: 'Ahmad Fauzi',
                schoolName: 'SD Islam Al-Azhar',
            },
        });
        mockPrisma.checkIn.create.mockResolvedValue({
            id: 'checkin-2',
            registrationId: regId,
            checkInMethod: client_1.CheckInMethod.MANUAL_CODE,
            checkInTime: new Date(),
            checkedInBy: { name: 'Petugas Meja 2' },
        });
        const res = await service.processCheckIn('staff-1', {
            token: regNumber,
            method: client_1.CheckInMethod.MANUAL_CODE,
        });
        expect(res.success).toBe(true);
        expect(res.already_checked_in).toBe(false);
    });
    it('CHECK-04: should reject unapproved registration', async () => {
        mockPrisma.registration.findFirst.mockResolvedValue({
            id: regId,
            registrationNumber: regNumber,
            status: client_1.RegistrationStatus.WAITING_VERIFICATION,
            checkIn: null,
            branch: { name: 'Tahfidz' },
        });
        const res = await service.processCheckIn('staff-1', {
            token: regNumber,
            method: client_1.CheckInMethod.MANUAL_CODE,
        });
        expect(res.success).toBe(false);
        expect(res.message).toContain('belum disetujui');
    });
    it('QR-SEC-02: should reject tampered QR code', async () => {
        const tampered = validQrToken.slice(0, -4) + '0000';
        mockPrisma.registration.findFirst.mockResolvedValue({
            id: regId,
            registrationNumber: regNumber,
            qrCodeToken: validQrToken,
            status: client_1.RegistrationStatus.APPROVED,
            checkIn: null,
            branch: { name: 'Tahfidz' },
        });
        const res = await service.processCheckIn('staff-1', {
            token: tampered,
            method: client_1.CheckInMethod.QR_SCAN,
        });
        expect(res.success).toBe(false);
        expect(res.message).toContain('tanda tangan digital telah dimanipulasi');
    });
});
//# sourceMappingURL=checkin.service.spec.js.map