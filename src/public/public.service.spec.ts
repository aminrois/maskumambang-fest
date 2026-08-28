import { Test, TestingModule } from '@nestjs/testing';
import { PublicService } from './public.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PublicService', () => {
  let service: PublicService;
  let prisma: PrismaService;

  const mockPrisma = {
    registration: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PublicService>(PublicService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('PUB-01 to PUB-04: should search participants by query and return formatted results', async () => {
    mockPrisma.registration.findMany.mockResolvedValue([
      {
        registrationNumber: 'REG-IND-2026-ABC123',
        status: 'APPROVED',
        individualParticipant: {
          fullName: 'Ahmad Fauzi',
          schoolName: 'SD Islam Al-Azhar',
          whatsappNumber: '081234567890', // Sensitive
        },
        team: null,
        branch: {
          name: 'Tahfidz Juz 30',
          level: {
            name: 'SD/MI',
            category: { name: 'Tahfidz' },
          },
        },
      },
    ]);

    const results = await service.searchParticipants('ahmad');
    expect(results).toHaveLength(1);

    const item = results[0];
    // PUB-05: Strict 7 allowed fields
    expect(item.registration_number).toBe('REG-IND-2026-ABC123');
    expect(item.participant_name).toBe('Ahmad Fauzi');
    expect(item.school_name).toBe('SD Islam Al-Azhar');
    expect(item.branch_name).toBe('Tahfidz Juz 30');
    expect(item.level_name).toBe('SD/MI');
    expect(item.category_name).toBe('Tahfidz');
    expect(item.status).toBe('APPROVED');

    // PUB-06: Zero sensitive data leakage
    expect((item as any).whatsapp_number).toBeUndefined();
    expect((item as any).whatsappNumber).toBeUndefined();
    expect((item as any).email).toBeUndefined();
    expect((item as any).password).toBeUndefined();
    expect((item as any).passwordHash).toBeUndefined();
    expect((item as any).proofImagePath).toBeUndefined();
  });

  it('should return empty list if query is too short or empty', async () => {
    const res1 = await service.searchParticipants('');
    expect(res1).toEqual([]);

    const res2 = await service.searchParticipants('a');
    expect(res2).toEqual([]);
  });
});
