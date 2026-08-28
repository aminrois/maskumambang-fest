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
exports.RegistrationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const crypto = require("crypto");
let RegistrationsService = class RegistrationsService {
    constructor(prisma, auditService, configService) {
        this.prisma = prisma;
        this.auditService = auditService;
        this.configService = configService;
    }
    generateRegistrationNumber(type) {
        const year = new Date().getFullYear();
        const hex = crypto.randomBytes(3).toString('hex').toUpperCase();
        return `REG-${type}-${year}-${hex}`;
    }
    generateQrToken(regId, regNumber) {
        const salt = this.configService.get('qr.salt') || 'default_salt';
        const uuidShort = regId.replace(/-/g, '').slice(0, 8);
        const regHex = Buffer.from(regNumber).toString('hex');
        const hmac = crypto
            .createHmac('sha256', salt)
            .update(`${regId}:${regNumber}`)
            .digest('hex');
        return `REGQR_${uuidShort}_${regHex}_${hmac}`;
    }
    async createIndividual(userId, dto) {
        const branch = await this.prisma.competitionBranch.findUnique({
            where: { id: dto.branchId },
            include: { level: { include: { category: true } } },
        });
        if (!branch) {
            throw new common_1.NotFoundException('Cabang lomba tidak ditemukan.');
        }
        if (!branch.isActive) {
            throw new common_1.BadRequestException('Cabang lomba yang dipilih sedang tidak aktif.');
        }
        if (branch.participantType !== client_1.ParticipantType.INDIVIDUAL) {
            throw new common_1.BadRequestException('Cabang lomba ini adalah kategori Beregu (TEAM), gunakan form pendaftaran tim.');
        }
        const regId = crypto.randomUUID();
        const regNumber = this.generateRegistrationNumber('IND');
        const qrToken = this.generateQrToken(regId, regNumber);
        const registration = await this.prisma.$transaction(async (tx) => {
            const reg = await tx.registration.create({
                data: {
                    id: regId,
                    registrationNumber: regNumber,
                    userId,
                    branchId: dto.branchId,
                    status: client_1.RegistrationStatus.WAITING_VERIFICATION,
                    qrCodeToken: qrToken,
                },
            });
            await tx.individualParticipant.create({
                data: {
                    registrationId: reg.id,
                    fullName: dto.fullName.trim(),
                    gender: dto.gender,
                    gradeClass: dto.gradeClass.trim(),
                    schoolName: dto.schoolName.trim(),
                    schoolAddress: dto.schoolAddress.trim(),
                    mentorName: dto.mentorName.trim(),
                    whatsappNumber: dto.whatsappNumber.trim(),
                },
            });
            return reg;
        });
        await this.auditService.log({
            userId,
            action: 'CREATE_REGISTRATION',
            targetTable: 'registrations',
            targetId: registration.id,
            details: `Pendaftaran individu baru: ${regNumber} (${dto.fullName} - ${branch.name})`,
        });
        return this.getRegistrationById(registration.id, userId, client_1.Role.PESERTA);
    }
    async createTeam(userId, dto) {
        const branch = await this.prisma.competitionBranch.findUnique({
            where: { id: dto.branchId },
            include: { level: { include: { category: true } } },
        });
        if (!branch) {
            throw new common_1.NotFoundException('Cabang lomba tidak ditemukan.');
        }
        if (!branch.isActive) {
            throw new common_1.BadRequestException('Cabang lomba yang dipilih sedang tidak aktif.');
        }
        if (branch.participantType !== client_1.ParticipantType.TEAM) {
            throw new common_1.BadRequestException('Cabang lomba ini adalah kategori Perorangan (INDIVIDUAL), gunakan form pendaftaran individu.');
        }
        const totalMembers = 1 + (dto.members ? dto.members.length : 0);
        const minMembers = branch.minTeamMembers || 2;
        const maxMembers = branch.maxTeamMembers || 10;
        if (totalMembers < minMembers) {
            throw new common_1.BadRequestException(`Jumlah anggota tim kurang dari batas minimum (${minMembers} orang termasuk ketua tim). Saat ini: ${totalMembers} orang.`);
        }
        if (totalMembers > maxMembers) {
            throw new common_1.BadRequestException(`Jumlah anggota tim melebihi batas maksimum (${maxMembers} orang termasuk ketua tim). Saat ini: ${totalMembers} orang.`);
        }
        const regId = crypto.randomUUID();
        const teamId = crypto.randomUUID();
        const regNumber = this.generateRegistrationNumber('TIM');
        const qrToken = this.generateQrToken(regId, regNumber);
        const registration = await this.prisma.$transaction(async (tx) => {
            const reg = await tx.registration.create({
                data: {
                    id: regId,
                    registrationNumber: regNumber,
                    userId,
                    branchId: dto.branchId,
                    status: client_1.RegistrationStatus.WAITING_VERIFICATION,
                    qrCodeToken: qrToken,
                },
            });
            const team = await tx.team.create({
                data: {
                    id: teamId,
                    registrationId: reg.id,
                    teamName: dto.teamName.trim(),
                    schoolName: dto.schoolName.trim(),
                    schoolAddress: dto.schoolAddress.trim(),
                    mentorName: dto.mentorName.trim(),
                    whatsappNumber: dto.whatsappNumber.trim(),
                    leaderName: dto.leaderName.trim(),
                },
            });
            if (dto.members && dto.members.length > 0) {
                await tx.teamMember.createMany({
                    data: dto.members.map((mem) => ({
                        teamId: team.id,
                        memberName: mem.memberName.trim(),
                        gender: mem.gender,
                        gradeClass: mem.gradeClass.trim(),
                        positionRole: mem.positionRole ? mem.positionRole.trim() : 'Anggota',
                    })),
                });
            }
            return reg;
        });
        await this.auditService.log({
            userId,
            action: 'CREATE_REGISTRATION',
            targetTable: 'registrations',
            targetId: registration.id,
            details: `Pendaftaran tim baru: ${regNumber} (${dto.teamName} - ${branch.name})`,
        });
        return this.getRegistrationById(registration.id, userId, client_1.Role.PESERTA);
    }
    async getUserRegistrations(userId) {
        return this.prisma.registration.findMany({
            where: { userId },
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
                team: {
                    include: {
                        members: true,
                    },
                },
                payments: {
                    include: {
                        paymentAccount: true,
                        verificationLogs: {
                            orderBy: { verifiedAt: 'desc' },
                            take: 1,
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
                checkIn: {
                    include: {
                        checkedInBy: {
                            select: { id: true, name: true, role: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getRegistrationById(id, requesterUserId, requesterRole) {
        const reg = await this.prisma.registration.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phoneNumber: true,
                    },
                },
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
                team: {
                    include: {
                        members: true,
                    },
                },
                payments: {
                    include: {
                        paymentAccount: true,
                        verificationLogs: {
                            include: {
                                verifiedBy: {
                                    select: { id: true, name: true, role: true },
                                },
                            },
                            orderBy: { verifiedAt: 'desc' },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
                checkIn: {
                    include: {
                        checkedInBy: {
                            select: { id: true, name: true, role: true },
                        },
                    },
                },
            },
        });
        if (!reg) {
            throw new common_1.NotFoundException('Data pendaftaran tidak ditemukan.');
        }
        if (requesterRole === client_1.Role.PESERTA && reg.userId !== requesterUserId) {
            throw new common_1.ForbiddenException('Akses ditolak: Anda tidak memiliki izin melihat data ini.');
        }
        return reg;
    }
    async listAllRegistrations(search, status, branchId, page = 1, perPage = 25) {
        const skip = (page - 1) * perPage;
        const where = {};
        if (status) {
            where.status = status;
        }
        if (branchId) {
            where.branchId = branchId;
        }
        if (search && search.trim()) {
            const q = search.trim();
            where.OR = [
                { registrationNumber: { contains: q, mode: 'insensitive' } },
                { individualParticipant: { fullName: { contains: q, mode: 'insensitive' } } },
                { individualParticipant: { schoolName: { contains: q, mode: 'insensitive' } } },
                { team: { teamName: { contains: q, mode: 'insensitive' } } },
                { team: { schoolName: { contains: q, mode: 'insensitive' } } },
                { user: { name: { contains: q, mode: 'insensitive' } } },
                { user: { email: { contains: q, mode: 'insensitive' } } },
            ];
        }
        const [registrations, total] = await Promise.all([
            this.prisma.registration.findMany({
                where,
                include: {
                    user: {
                        select: { id: true, name: true, email: true, phoneNumber: true },
                    },
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
                    team: {
                        include: {
                            members: true,
                        },
                    },
                    payments: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                    },
                    checkIn: true,
                },
                skip,
                take: perPage,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.registration.count({ where }),
        ]);
        return {
            registrations,
            pagination: {
                total,
                page,
                perPage,
                totalPages: Math.ceil(total / perPage),
            },
        };
    }
};
exports.RegistrationsService = RegistrationsService;
exports.RegistrationsService = RegistrationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        config_1.ConfigService])
], RegistrationsService);
//# sourceMappingURL=registrations.service.js.map