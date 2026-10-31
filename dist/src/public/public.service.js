"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let PublicService = class PublicService {
    constructor(prisma) {
        this.prisma = prisma;
        this.cachedStats = null;
    }
    async getHomepageStats() {
        const now = Date.now();
        if (this.cachedStats && this.cachedStats.expiresAt > now) {
            return this.cachedStats.data;
        }
        const submittedFilter = {
            status: {
                in: [client_1.RegistrationStatus.WAITING_VERIFICATION, client_1.RegistrationStatus.APPROVED],
            },
        };
        const individualCount = await this.prisma.individualParticipant.count({
            where: {
                registration: submittedFilter,
            },
        });
        const teams = await this.prisma.team.findMany({
            where: {
                registration: submittedFilter,
            },
            select: {
                leaderName: true,
                members: {
                    select: {
                        memberName: true,
                        positionRole: true,
                    },
                },
            },
        });
        let teamParticipantCount = 0;
        for (const t of teams) {
            const hasLeaderInMembers = t.members.some((m) => m.positionRole === 'Ketua Tim' ||
                (m.memberName &&
                    t.leaderName &&
                    m.memberName.trim().toLowerCase() === t.leaderName.trim().toLowerCase()));
            teamParticipantCount += hasLeaderInMembers
                ? t.members.length
                : 1 + t.members.length;
        }
        const totalParticipants = individualCount + teamParticipantCount;
        const totalBranches = await this.prisma.competitionBranch.count({
            where: { isActive: true },
        });
        const result = {
            totalParticipants,
            individualCount,
            teamParticipantCount,
            totalTeams: teams.length,
            totalBranches,
        };
        this.cachedStats = {
            data: result,
            expiresAt: now + 30000,
        };
        return result;
    }
    async searchParticipants(query) {
        if (!query || query.trim().length < 2) {
            return [];
        }
        const cleaned = query.trim();
        const registrations = await this.prisma.registration.findMany({
            where: {
                OR: [
                    { registrationNumber: { contains: cleaned, mode: 'insensitive' } },
                    {
                        individualParticipant: {
                            OR: [
                                { fullName: { contains: cleaned, mode: 'insensitive' } },
                                { schoolName: { contains: cleaned, mode: 'insensitive' } },
                            ],
                        },
                    },
                    {
                        team: {
                            OR: [
                                { teamName: { contains: cleaned, mode: 'insensitive' } },
                                { schoolName: { contains: cleaned, mode: 'insensitive' } },
                            ],
                        },
                    },
                ],
            },
            include: {
                branch: {
                    include: {
                        level: {
                            include: {
                                category: true,
                            },
                        },
                    },
                },
                individualParticipant: true,
                team: true,
            },
            take: 50,
            orderBy: { createdAt: 'desc' },
        });
        return registrations.map((r) => {
            const participantName = r.individualParticipant?.fullName || r.team?.teamName || 'Peserta';
            const schoolName = r.individualParticipant?.schoolName || r.team?.schoolName || '-';
            return {
                registration_number: r.registrationNumber,
                participant_name: participantName,
                school_name: schoolName,
                branch_name: r.branch.name,
                level_name: r.branch.level.name,
                category_name: r.branch.level.category.name,
                status: r.status,
            };
        });
    }
};
exports.PublicService = PublicService;
exports.PublicService = PublicService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PublicService);
//# sourceMappingURL=public.service.js.map