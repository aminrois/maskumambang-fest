import { Test, TestingModule } from '@nestjs/testing';
import { CheckInService } from './checkin.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ConfigService } from '@nestjs/config';
import { CheckInMethod, ParticipantType, RegistrationStatus } from '@prisma/client';
import { QrEngineUtil } from '../common/utils/qr-engine.util';

describe('CheckInService', () => {
  let service: CheckInService;
  let prisma: PrismaService;

  const salt = 'test_salt_12345';
  const regId = 'reg-uuid-1';
  const regNumber = 'REG-IND-2026-ABC123';
  const validQrToken = QrEngineUtil.generateToken(regId, regNumber, salt);

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
      if (key === 'qr.salt') return salt;
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckInService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<CheckInService>(CheckInService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('CHECK-01: should process valid QR check-in successfully', async () => {
    mockPrisma.registration.findFirst.mockResolvedValue({
      id: regId,
      registrationNumber: regNumber,
      qrCodeToken: validQrToken,
      status: RegistrationStatus.APPROVED,
      checkIn: null, // Not yet checked in
      branch: {
        name: 'Tahfidz Juz 30',
        participantType: ParticipantType.INDIVIDUAL,
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
      checkInMethod: CheckInMethod.QR_SCAN,
      checkInTime: new Date('2026-08-27T08:00:00Z'),
      checkedInBy: { name: 'Petugas Meja 1' },
    });

    const res = await service.processCheckIn('staff-1', {
      token: validQrToken,
      method: CheckInMethod.QR_SCAN,
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
      status: RegistrationStatus.APPROVED,
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
      method: CheckInMethod.QR_SCAN,
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
      status: RegistrationStatus.APPROVED,
      checkIn: null,
      branch: {
        name: 'Tahfidz Juz 30',
        participantType: ParticipantType.INDIVIDUAL,
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
      checkInMethod: CheckInMethod.MANUAL_CODE,
      checkInTime: new Date(),
      checkedInBy: { name: 'Petugas Meja 2' },
    });

    const res = await service.processCheckIn('staff-1', {
      token: regNumber,
      method: CheckInMethod.MANUAL_CODE,
    });

    expect(res.success).toBe(true);
    expect(res.already_checked_in).toBe(false);
  });

  it('CHECK-04: should reject unapproved registration', async () => {
    mockPrisma.registration.findFirst.mockResolvedValue({
      id: regId,
      registrationNumber: regNumber,
      status: RegistrationStatus.WAITING_VERIFICATION,
      checkIn: null,
      branch: { name: 'Tahfidz' },
    });

    const res = await service.processCheckIn('staff-1', {
      token: regNumber,
      method: CheckInMethod.MANUAL_CODE,
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
      status: RegistrationStatus.APPROVED,
      checkIn: null,
      branch: { name: 'Tahfidz' },
    });

    const res = await service.processCheckIn('staff-1', {
      token: tampered,
      method: CheckInMethod.QR_SCAN,
    });

    expect(res.success).toBe(false);
    expect(res.message).toContain('tanda tangan digital telah dimanipulasi');
  });
});
