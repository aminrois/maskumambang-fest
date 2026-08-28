"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const public_service_1 = require("./public.service");
const prisma_service_1 = require("../prisma/prisma.service");
describe('PublicService', () => {
    let service;
    let prisma;
    const mockPrisma = {
        registration: {
            findMany: jest.fn(),
        },
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                public_service_1.PublicService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrisma },
            ],
        }).compile();
        service = module.get(public_service_1.PublicService);
        prisma = module.get(prisma_service_1.PrismaService);
    });
    it('PUB-01 to PUB-04: should search participants by query and return formatted results', async () => {
        mockPrisma.registration.findMany.mockResolvedValue([
            {
                registrationNumber: 'REG-IND-2026-ABC123',
                status: 'APPROVED',
                individualParticipant: {
                    fullName: 'Ahmad Fauzi',
                    schoolName: 'SD Islam Al-Azhar',
                    whatsappNumber: '081234567890',
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
        expect(item.registration_number).toBe('REG-IND-2026-ABC123');
        expect(item.participant_name).toBe('Ahmad Fauzi');
        expect(item.school_name).toBe('SD Islam Al-Azhar');
        expect(item.branch_name).toBe('Tahfidz Juz 30');
        expect(item.level_name).toBe('SD/MI');
        expect(item.category_name).toBe('Tahfidz');
        expect(item.status).toBe('APPROVED');
        expect(item.whatsapp_number).toBeUndefined();
        expect(item.whatsappNumber).toBeUndefined();
        expect(item.email).toBeUndefined();
        expect(item.password).toBeUndefined();
        expect(item.passwordHash).toBeUndefined();
        expect(item.proofImagePath).toBeUndefined();
    });
    it('should return empty list if query is too short or empty', async () => {
        const res1 = await service.searchParticipants('');
        expect(res1).toEqual([]);
        const res2 = await service.searchParticipants('a');
        expect(res2).toEqual([]);
    });
});
//# sourceMappingURL=public.service.spec.js.map