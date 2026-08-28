"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const cards_service_1 = require("./cards.service");
const prisma_service_1 = require("../prisma/prisma.service");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
describe('CardsService', () => {
    let service;
    let prisma;
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
        const module = await testing_1.Test.createTestingModule({
            providers: [
                cards_service_1.CardsService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrisma },
            ],
        }).compile();
        service = module.get(cards_service_1.CardsService);
        prisma = module.get(prisma_service_1.PrismaService);
    });
    it('CARD-SEC-01: should reject card generation if registration is not APPROVED', async () => {
        mockPrisma.registration.findUnique.mockResolvedValue({
            id: 'reg-unapproved',
            userId: 'user-1',
            status: client_1.RegistrationStatus.WAITING_VERIFICATION,
            branch: { level: { category: {} } },
        });
        await expect(service.getParticipantCard('reg-unapproved', 'user-1', client_1.Role.PESERTA)).rejects.toThrow(common_1.BadRequestException);
    });
    it('CARD-SEC-02: should reject card generation if user is not the owner (IDOR check)', async () => {
        mockPrisma.registration.findUnique.mockResolvedValue({
            id: 'reg-approved',
            userId: 'user-other',
            status: client_1.RegistrationStatus.APPROVED,
            branch: { level: { category: {} } },
        });
        await expect(service.getParticipantCard('reg-approved', 'user-attacker', client_1.Role.PESERTA)).rejects.toThrow(common_1.ForbiddenException);
    });
    it('CARD-01: should return official card and QR Base64 URI for approved registration', async () => {
        mockPrisma.registration.findUnique.mockResolvedValue({
            id: 'reg-approved',
            userId: 'user-1',
            registrationNumber: 'REG-IND-2026-ABC123',
            qrCodeToken: 'REGQR_12345678_aabb_ccdd',
            status: client_1.RegistrationStatus.APPROVED,
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
                mentorName: 'Ustadz Ali',
            },
        });
        const card = await service.getParticipantCard('reg-approved', 'user-1', client_1.Role.PESERTA);
        expect(card).toBeDefined();
        expect(card.registration_number).toBe('REG-IND-2026-ABC123');
        expect(card.participant_name).toBe('Ahmad Fauzi');
        expect(card.qr_data_uri.startsWith('data:image/png;base64,')).toBe(true);
    });
});
//# sourceMappingURL=cards.service.spec.js.map