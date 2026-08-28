import { Test, TestingModule } from '@nestjs/testing';
import { RegistrationsService } from './registrations.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Gender, ParticipantType, RegistrationStatus, Role } from '@prisma/client';

describe('RegistrationsService', () => {
  let service: RegistrationsService;
  let prisma: PrismaService;

  const mockPrisma = {
    competitionBranch: {
      findUnique: jest.fn(),
    },
    registration: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    individualParticipant: {
      create: jest.fn(),
    },
    team: {
      create: jest.fn(),
    },
    teamMember: {
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockAudit = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  const mockConfig = {
    get: jest.fn().mockReturnValue('test_salt'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<RegistrationsService>(RegistrationsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('createIndividual', () => {
    it('REG-01: should create individual registration successfully', async () => {
      mockPrisma.competitionBranch.findUnique.mockResolvedValue({
        id: 'br-indiv',
        name: 'Tahfidz Juz 30',
        participantType: ParticipantType.INDIVIDUAL,
        isActive: true,
        level: { category: { name: 'Tahfidz' } },
      });

      mockPrisma.$transaction.mockImplementation(async (cb) => {
        return cb({
          registration: {
            create: jest.fn().mockResolvedValue({ id: 'reg-1', registrationNumber: 'REG-IND-2026-ABC123' }),
          },
          individualParticipant: {
            create: jest.fn().mockResolvedValue({ id: 'indiv-1' }),
          },
        });
      });

      mockPrisma.registration.findUnique.mockResolvedValue({
        id: 'reg-1',
        registrationNumber: 'REG-IND-2026-ABC123',
        userId: 'user-1',
        status: RegistrationStatus.WAITING_VERIFICATION,
        branch: { name: 'Tahfidz Juz 30', level: { category: { name: 'Tahfidz' } } },
        individualParticipant: { fullName: 'Ahmad' },
      });

      const res = await service.createIndividual('user-1', {
        branchId: 'br-indiv',
        fullName: 'Ahmad',
        gender: Gender.L,
        gradeClass: '5 SD',
        schoolName: 'SD Al-Azhar',
        schoolAddress: 'Jl. Pemuda',
        mentorName: 'Ustadz Ali',
        whatsappNumber: '0812345678',
      });

      expect(res).toBeDefined();
      expect(res.registrationNumber).toContain('REG-IND-');
    });

    it('REG-04: should reject team registration payload on individual branch', async () => {
      mockPrisma.competitionBranch.findUnique.mockResolvedValue({
        id: 'br-indiv',
        name: 'Tahfidz Juz 30',
        participantType: ParticipantType.INDIVIDUAL,
        isActive: true,
      });

      await expect(
        service.createTeam('user-1', {
          branchId: 'br-indiv',
          teamName: 'Team Alpha',
          schoolName: 'SMP 1',
          schoolAddress: 'Jl. Merdeka',
          mentorName: 'Pak Budi',
          whatsappNumber: '08123456',
          leaderName: 'Leader 1',
          members: [
            { memberName: 'M1', gender: Gender.L, gradeClass: '8' },
            { memberName: 'M2', gender: Gender.P, gradeClass: '8' },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createTeam', () => {
    it('TEAM-01 & TEAM-03: should create team registration within min and max members', async () => {
      mockPrisma.competitionBranch.findUnique.mockResolvedValue({
        id: 'br-team',
        name: 'Robot Soccer',
        participantType: ParticipantType.TEAM,
        minTeamMembers: 2,
        maxTeamMembers: 4,
        isActive: true,
        level: { category: { name: 'Robotik' } },
      });

      mockPrisma.$transaction.mockImplementation(async (cb) => {
        return cb({
          registration: {
            create: jest.fn().mockResolvedValue({ id: 'reg-team-1', registrationNumber: 'REG-TIM-2026-XYZ789' }),
          },
          team: {
            create: jest.fn().mockResolvedValue({ id: 'team-1' }),
          },
          teamMember: {
            createMany: jest.fn().mockResolvedValue({ count: 2 }),
          },
        });
      });

      mockPrisma.registration.findUnique.mockResolvedValue({
        id: 'reg-team-1',
        registrationNumber: 'REG-TIM-2026-XYZ789',
        userId: 'user-1',
        status: RegistrationStatus.WAITING_VERIFICATION,
        branch: { name: 'Robot Soccer', level: { category: { name: 'Robotik' } } },
        team: {
          teamName: 'RoboTeam',
          members: [
            { memberName: 'Member 1', gender: Gender.L, gradeClass: '8' },
            { memberName: 'Member 2', gender: Gender.P, gradeClass: '8' },
          ],
        },
      });

      // Total 3 members (1 leader + 2 members) -> within 2 to 4
      const res = await service.createTeam('user-1', {
        branchId: 'br-team',
        teamName: 'RoboTeam',
        schoolName: 'SMP 1',
        schoolAddress: 'Jl. Merdeka',
        mentorName: 'Pak Budi',
        whatsappNumber: '08123456',
        leaderName: 'Leader 1',
        members: [
          { memberName: 'Member 1', gender: Gender.L, gradeClass: '8' },
          { memberName: 'Member 2', gender: Gender.P, gradeClass: '8' },
        ],
      });

      expect(res).toBeDefined();
      expect(res.registrationNumber).toContain('REG-TIM-');
    });

    it('TEAM-02: should reject team registration if total members below minimum', async () => {
      mockPrisma.competitionBranch.findUnique.mockResolvedValue({
        id: 'br-team',
        name: 'Robot Soccer',
        participantType: ParticipantType.TEAM,
        minTeamMembers: 3, // Requires at least 3 people
        maxTeamMembers: 5,
        isActive: true,
      });

      // 1 leader + 0 members = 1 member (below min 3)
      await expect(
        service.createTeam('user-1', {
          branchId: 'br-team',
          teamName: 'RoboTeam',
          schoolName: 'SMP 1',
          schoolAddress: 'Jl. Merdeka',
          mentorName: 'Pak Budi',
          whatsappNumber: '08123456',
          leaderName: 'Leader Only',
          members: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('TEAM-04: should reject team registration if total members exceed maximum', async () => {
      mockPrisma.competitionBranch.findUnique.mockResolvedValue({
        id: 'br-team',
        name: 'Robot Soccer',
        participantType: ParticipantType.TEAM,
        minTeamMembers: 2,
        maxTeamMembers: 3, // Max 3 people
        isActive: true,
      });

      // 1 leader + 3 members = 4 members (exceeds max 3)
      await expect(
        service.createTeam('user-1', {
          branchId: 'br-team',
          teamName: 'RoboTeam',
          schoolName: 'SMP 1',
          schoolAddress: 'Jl. Merdeka',
          mentorName: 'Pak Budi',
          whatsappNumber: '08123456',
          leaderName: 'Leader 1',
          members: [
            { memberName: 'M1', gender: Gender.L, gradeClass: '8' },
            { memberName: 'M2', gender: Gender.P, gradeClass: '8' },
            { memberName: 'M3', gender: Gender.L, gradeClass: '8' },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('IDOR Protection', () => {
    it('SEC-REG-03: Peserta cannot read another user registration', async () => {
      mockPrisma.registration.findUnique.mockResolvedValue({
        id: 'reg-other',
        userId: 'user-other', // Belongs to user-other
      });

      // Peserta user-1 tries to read user-other's registration
      await expect(
        service.getRegistrationById('reg-other', 'user-1', Role.PESERTA),
      ).rejects.toThrow(ForbiddenException);
    });

    it('Super Admin and Bendahara can read any registration for supervision', async () => {
      mockPrisma.registration.findUnique.mockResolvedValue({
        id: 'reg-other',
        userId: 'user-other',
      });

      const res = await service.getRegistrationById('reg-other', 'admin-id', Role.SUPER_ADMIN);
      expect(res).toBeDefined();
    });
  });
});
