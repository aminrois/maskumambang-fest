"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const competitions_service_1 = require("./competitions.service");
const prisma_service_1 = require("../prisma/prisma.service");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
describe('CompetitionsService', () => {
    let service;
    let prisma;
    const mockPrisma = {
        competitionCategory: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        competitionLevel: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        competitionBranch: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                competitions_service_1.CompetitionsService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrisma },
            ],
        }).compile();
        service = module.get(competitions_service_1.CompetitionsService);
        prisma = module.get(prisma_service_1.PrismaService);
    });
    it('COMP-01: should return competition tree with categories, levels, and branches', async () => {
        mockPrisma.competitionCategory.findMany.mockResolvedValue([
            {
                id: 'cat-1',
                name: 'Robotik',
                levels: [
                    {
                        id: 'lvl-1',
                        name: 'SMP',
                        branches: [
                            { id: 'br-1', name: 'Soccer', participantType: client_1.ParticipantType.TEAM },
                        ],
                    },
                ],
            },
        ]);
        const tree = await service.getTree();
        expect(tree).toHaveLength(1);
        expect(tree[0].name).toBe('Robotik');
        expect(tree[0].levels[0].branches[0].name).toBe('Soccer');
    });
    it('COMP-04: should return branch detail', async () => {
        mockPrisma.competitionBranch.findUnique.mockResolvedValue({
            id: 'br-1',
            name: 'Creative Robot',
            participantType: client_1.ParticipantType.TEAM,
            minTeamMembers: 2,
            maxTeamMembers: 4,
            isActive: true,
            level: {
                id: 'lvl-1',
                name: 'SMA',
                category: { id: 'cat-1', name: 'Robotik' },
            },
        });
        const branch = await service.getBranchDetail('br-1');
        expect(branch).toBeDefined();
        expect(branch.name).toBe('Creative Robot');
        expect(branch.participantType).toBe(client_1.ParticipantType.TEAM);
    });
    it('COMP-05: validateHierarchy should reject inactive branch', async () => {
        mockPrisma.competitionBranch.findUnique.mockResolvedValue({
            id: 'br-inactive',
            name: 'Inactive Branch',
            isActive: false,
            levelId: 'lvl-1',
            level: { categoryId: 'cat-1' },
        });
        await expect(service.validateHierarchy('cat-1', 'lvl-1', 'br-inactive')).rejects.toThrow(common_1.BadRequestException);
    });
    it('COMP-06: validateHierarchy should reject mismatched level and branch', async () => {
        mockPrisma.competitionBranch.findUnique.mockResolvedValue({
            id: 'br-1',
            name: 'Soccer',
            isActive: true,
            levelId: 'lvl-2',
            level: { categoryId: 'cat-1' },
        });
        await expect(service.validateHierarchy('cat-1', 'lvl-1', 'br-1')).rejects.toThrow(common_1.BadRequestException);
    });
});
//# sourceMappingURL=competitions.service.spec.js.map