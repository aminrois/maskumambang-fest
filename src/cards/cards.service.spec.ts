import { Test, TestingModule } from '@nestjs/testing';
import { CardsService } from './cards.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ParticipantType, RegistrationStatus, Role } from '@prisma/client';

describe('CardsService', () => {
  let service: CardsService;
  let prisma: PrismaService;

  const mockPrisma = {
    registration: {
      findUnique: jest.fn(),
    },
    appSetting: {
      findMany: jest.fn().mockResolvedValue([
        { key: 'application_name', value: 'SISTEM PENDAFTARAN LOMBA' },
      ]),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CardsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CardsService>(CardsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('CARD-SEC-01: should reject card generation if registration is not APPROVED', async () => {
    mockPrisma.registration.findUnique.mockResolvedValue({
      id: 'reg-unapproved',
      userId: 'user-1',
      status: RegistrationStatus.WAITING_VERIFICATION,
      branch: { level: { category: {} } },
    });

    await expect(
      service.getParticipantCard('reg-unapproved', 'user-1', Role.PESERTA),
    ).rejects.toThrow(BadRequestException);
  });

  it('CARD-SEC-02: should reject card generation if user is not the owner (IDOR check)', async () => {
    mockPrisma.registration.findUnique.mockResolvedValue({
      id: 'reg-approved',
      userId: 'user-other',
      status: RegistrationStatus.APPROVED,
      branch: { level: { category: {} } },
    });

    await expect(
      service.getParticipantCard('reg-approved', 'user-attacker', Role.PESERTA),
    ).rejects.toThrow(ForbiddenException);
  });

  it('CARD-01: should return official card and QR Base64 URI for approved registration', async () => {
    mockPrisma.registration.findUnique.mockResolvedValue({
      id: 'reg-approved',
      userId: 'user-1',
      registrationNumber: 'REG-IND-2026-ABC123',
      qrCodeToken: 'REGQR_12345678_aabb_ccdd',
      status: RegistrationStatus.APPROVED,
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
        mentorName: 'Ustadz Ali',
      },
    });

    const card = await service.getParticipantCard('reg-approved', 'user-1', Role.PESERTA);
    expect(card).toBeDefined();
    expect(card.registration_number).toBe('REG-IND-2026-ABC123');
    expect(card.participant_name).toBe('Ahmad Fauzi');
    expect(card.qr_data_uri.startsWith('data:image/png;base64,')).toBe(true);
  });
});
