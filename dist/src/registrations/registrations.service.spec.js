"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const registrations_service_1 = require("./registrations.service");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
describe('RegistrationsService', () => {
    let service;
    let prisma;
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
        const module = await testing_1.Test.createTestingModule({
            providers: [
                registrations_service_1.RegistrationsService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrisma },
                { provide: audit_service_1.AuditService, useValue: mockAudit },
                { provide: config_1.ConfigService, useValue: mockConfig },
            ],
        }).compile();
        service = module.get(registrations_service_1.RegistrationsService);
        prisma = module.get(prisma_service_1.PrismaService);
    });
    describe('createIndividual', () => {
        it('REG-01: should create individual registration successfully', async () => {
            mockPrisma.competitionBranch.findUnique.mockResolvedValue({
                id: 'br-indiv',
                name: 'Tahfidz Juz 30',
                participantType: client_1.ParticipantType.INDIVIDUAL,
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
                status: client_1.RegistrationStatus.WAITING_VERIFICATION,
                branch: { name: 'Tahfidz Juz 30', level: { category: { name: 'Tahfidz' } } },
                individualParticipant: { fullName: 'Ahmad' },
            });
            const res = await service.createIndividual('user-1', {
                branchId: 'br-indiv',
                fullName: 'Ahmad',
                gender: client_1.Gender.L,
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
                participantType: client_1.ParticipantType.INDIVIDUAL,
                isActive: true,
            });
            await expect(service.createTeam('user-1', {
                branchId: 'br-indiv',
                teamName: 'Team Alpha',
                schoolName: 'SMP 1',
                schoolAddress: 'Jl. Merdeka',
                mentorName: 'Pak Budi',
                whatsappNumber: '08123456',
                leaderName: 'Leader 1',
                members: [
                    { memberName: 'M1', gender: client_1.Gender.L, gradeClass: '8' },
                    { memberName: 'M2', gender: client_1.Gender.P, gradeClass: '8' },
                ],
            })).rejects.toThrow(common_1.BadRequestException);
        });
    });
    describe('createTeam', () => {
        it('TEAM-01 & TEAM-03: should create team registration within min and max members', async () => {
            mockPrisma.competitionBranch.findUnique.mockResolvedValue({
                id: 'br-team',
                name: 'Robot Soccer',
                participantType: client_1.ParticipantType.TEAM,
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
                status: client_1.RegistrationStatus.WAITING_VERIFICATION,
                branch: { name: 'Robot Soccer', level: { category: { name: 'Robotik' } } },
                team: {
                    teamName: 'RoboTeam',
                    members: [
                        { memberName: 'Member 1', gender: client_1.Gender.L, gradeClass: '8' },
                        { memberName: 'Member 2', gender: client_1.Gender.P, gradeClass: '8' },
                    ],
                },
            });
            const res = await service.createTeam('user-1', {
                branchId: 'br-team',
                teamName: 'RoboTeam',
                schoolName: 'SMP 1',
                schoolAddress: 'Jl. Merdeka',
                mentorName: 'Pak Budi',
                whatsappNumber: '08123456',
                leaderName: 'Leader 1',
                members: [
                    { memberName: 'Member 1', gender: client_1.Gender.L, gradeClass: '8' },
                    { memberName: 'Member 2', gender: client_1.Gender.P, gradeClass: '8' },
                ],
            });
            expect(res).toBeDefined();
            expect(res.registrationNumber).toContain('REG-TIM-');
        });
        it('TEAM-02: should reject team registration if total members below minimum', async () => {
            mockPrisma.competitionBranch.findUnique.mockResolvedValue({
                id: 'br-team',
                name: 'Robot Soccer',
                participantType: client_1.ParticipantType.TEAM,
                minTeamMembers: 3,
                maxTeamMembers: 5,
                isActive: true,
            });
            await expect(service.createTeam('user-1', {
                branchId: 'br-team',
                teamName: 'RoboTeam',
                schoolName: 'SMP 1',
                schoolAddress: 'Jl. Merdeka',
                mentorName: 'Pak Budi',
                whatsappNumber: '08123456',
                leaderName: 'Leader Only',
                members: [],
            })).rejects.toThrow(common_1.BadRequestException);
        });
        it('TEAM-04: should reject team registration if total members exceed maximum', async () => {
            mockPrisma.competitionBranch.findUnique.mockResolvedValue({
                id: 'br-team',
                name: 'Robot Soccer',
                participantType: client_1.ParticipantType.TEAM,
                minTeamMembers: 2,
                maxTeamMembers: 3,
                isActive: true,
            });
            await expect(service.createTeam('user-1', {
                branchId: 'br-team',
                teamName: 'RoboTeam',
                schoolName: 'SMP 1',
                schoolAddress: 'Jl. Merdeka',
                mentorName: 'Pak Budi',
                whatsappNumber: '08123456',
                leaderName: 'Leader 1',
                members: [
                    { memberName: 'M1', gender: client_1.Gender.L, gradeClass: '8' },
                    { memberName: 'M2', gender: client_1.Gender.P, gradeClass: '8' },
                    { memberName: 'M3', gender: client_1.Gender.L, gradeClass: '8' },
                ],
            })).rejects.toThrow(common_1.BadRequestException);
        });
    });
    describe('IDOR Protection', () => {
        it('SEC-REG-03: Peserta cannot read another user registration', async () => {
            mockPrisma.registration.findUnique.mockResolvedValue({
                id: 'reg-other',
                userId: 'user-other',
            });
            await expect(service.getRegistrationById('reg-other', 'user-1', client_1.Role.PESERTA)).rejects.toThrow(common_1.ForbiddenException);
        });
        it('Super Admin and Bendahara can read any registration for supervision', async () => {
            mockPrisma.registration.findUnique.mockResolvedValue({
                id: 'reg-other',
                userId: 'user-other',
            });
            const res = await service.getRegistrationById('reg-other', 'admin-id', client_1.Role.SUPER_ADMIN);
            expect(res).toBeDefined();
        });
    });
});
//# sourceMappingURL=registrations.service.spec.js.map