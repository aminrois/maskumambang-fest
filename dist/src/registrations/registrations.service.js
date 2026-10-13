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
const hash_util_1 = require("../common/utils/hash.util");
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
    async updateRegistration(id, adminId, dto) {
        const reg = await this.prisma.registration.findUnique({
            where: { id },
            include: {
                branch: { include: { level: { include: { category: true } } } },
                individualParticipant: true,
                team: { include: { members: true } },
            },
        });
        if (!reg) {
            throw new common_1.NotFoundException('Data pendaftaran tidak ditemukan.');
        }
        let targetBranch = reg.branch;
        if (dto.branchId && dto.branchId !== reg.branchId) {
            const newBranch = await this.prisma.competitionBranch.findUnique({
                where: { id: dto.branchId },
                include: { level: { include: { category: true } } },
            });
            if (!newBranch)
                throw new common_1.NotFoundException('Cabang lomba tujuan tidak ditemukan.');
            targetBranch = newBranch;
        }
        const isIndiv = targetBranch.participantType === 'INDIVIDUAL';
        await this.prisma.$transaction(async (tx) => {
            await tx.registration.update({
                where: { id },
                data: {
                    ...(dto.branchId ? { branchId: dto.branchId } : {}),
                    ...(dto.status ? { status: dto.status } : {}),
                },
            });
            if (isIndiv) {
                const indivData = {};
                if (dto.fullName !== undefined)
                    indivData.fullName = dto.fullName.trim();
                if (dto.gender !== undefined)
                    indivData.gender = dto.gender;
                if (dto.gradeClass !== undefined)
                    indivData.gradeClass = dto.gradeClass.trim();
                if (dto.schoolName !== undefined)
                    indivData.schoolName = dto.schoolName.trim();
                if (dto.schoolAddress !== undefined)
                    indivData.schoolAddress = dto.schoolAddress.trim();
                if (dto.mentorName !== undefined)
                    indivData.mentorName = dto.mentorName.trim();
                if (dto.whatsappNumber !== undefined)
                    indivData.whatsappNumber = dto.whatsappNumber.trim();
                if (Object.keys(indivData).length > 0) {
                    if (reg.individualParticipant) {
                        await tx.individualParticipant.update({
                            where: { registrationId: id },
                            data: indivData,
                        });
                    }
                    else {
                        await tx.individualParticipant.create({
                            data: { registrationId: id, ...indivData },
                        });
                    }
                }
            }
            else {
                const teamData = {};
                if (dto.teamName !== undefined)
                    teamData.teamName = dto.teamName.trim();
                if (dto.schoolName !== undefined)
                    teamData.schoolName = dto.schoolName.trim();
                if (dto.schoolAddress !== undefined)
                    teamData.schoolAddress = dto.schoolAddress.trim();
                if (dto.mentorName !== undefined)
                    teamData.mentorName = dto.mentorName.trim();
                if (dto.whatsappNumber !== undefined)
                    teamData.whatsappNumber = dto.whatsappNumber.trim();
                if (dto.leaderName !== undefined)
                    teamData.leaderName = dto.leaderName.trim();
                let teamId;
                if (reg.team) {
                    await tx.team.update({ where: { registrationId: id }, data: teamData });
                    teamId = reg.team.id;
                }
                else {
                    const newTeam = await tx.team.create({ data: { registrationId: id, ...teamData } });
                    teamId = newTeam.id;
                }
                if (dto.members !== undefined) {
                    await tx.teamMember.deleteMany({ where: { teamId } });
                    if (dto.members.length > 0) {
                        await tx.teamMember.createMany({
                            data: dto.members.map((m) => ({
                                teamId,
                                memberName: m.memberName.trim(),
                                gender: m.gender,
                                gradeClass: m.gradeClass.trim(),
                                positionRole: m.positionRole ? m.positionRole.trim() : 'Anggota',
                            })),
                        });
                    }
                }
            }
        });
        await this.auditService.log({
            userId: adminId,
            action: 'UPDATE_REGISTRATION',
            targetTable: 'registrations',
            targetId: id,
            details: `Data pendaftaran ${reg.registrationNumber} diperbarui oleh Super Admin.`,
        });
        return this.getRegistrationById(id, adminId, client_1.Role.SUPER_ADMIN);
    }
    async bulkImport(adminId, dto) {
        if (!dto.items || dto.items.length === 0) {
            throw new common_1.BadRequestException('Daftar peserta untuk diimpor tidak boleh kosong.');
        }
        let schoolUser;
        const plainPassword = dto.schoolAccount.password?.trim() || 'fest2026';
        if (dto.schoolAccount.mode === 'new') {
            const email = (dto.schoolAccount.email || '').trim().toLowerCase();
            if (!email) {
                throw new common_1.BadRequestException('Email sekolah wajib diisi untuk pembuatan akun baru.');
            }
            const existing = await this.prisma.user.findUnique({ where: { email } });
            if (existing) {
                if (existing.role === client_1.Role.PESERTA) {
                    schoolUser = existing;
                }
                else {
                    throw new common_1.ConflictException(`Email ${email} sudah terdaftar dengan hak akses staff/admin.`);
                }
            }
            else {
                const passwordHash = await hash_util_1.HashUtil.hashPassword(plainPassword);
                schoolUser = await this.prisma.user.create({
                    data: {
                        name: (dto.schoolAccount.schoolName || dto.schoolAccount.mentorName || 'Sekolah Peserta').trim(),
                        email,
                        phoneNumber: (dto.schoolAccount.phoneNumber || '080000000000').trim(),
                        passwordHash,
                        role: client_1.Role.PESERTA,
                        isActive: true,
                    },
                });
            }
        }
        else {
            if (!dto.schoolAccount.existingUserId) {
                throw new common_1.BadRequestException('ID akun sekolah wajib dipilih.');
            }
            schoolUser = await this.prisma.user.findUnique({
                where: { id: dto.schoolAccount.existingUserId },
            });
            if (!schoolUser) {
                throw new common_1.NotFoundException('Akun sekolah yang dipilih tidak ditemukan.');
            }
        }
        const allBranches = await this.prisma.competitionBranch.findMany({
            include: {
                level: {
                    include: {
                        category: true,
                    },
                },
            },
        });
        const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const findBranch = (item) => {
            if (item.branchId) {
                const b = allBranches.find((br) => br.id === item.branchId);
                if (b)
                    return b;
            }
            const bName = norm(item.branchName);
            const lName = norm(item.levelName || '');
            const cName = norm(item.categoryName || '');
            let match = allBranches.find((b) => {
                const bMatch = norm(b.name) === bName;
                const lMatch = !lName || norm(b.level.name) === lName || norm(b.level.name).includes(lName) || lName.includes(norm(b.level.name));
                const cMatch = !cName || norm(b.level.category.name) === cName || norm(b.level.category.name).includes(cName);
                return bMatch && (lMatch || cMatch);
            });
            if (!match) {
                match = allBranches.find((b) => {
                    const bMatch = norm(b.name).includes(bName) || bName.includes(norm(b.name));
                    const lMatch = !lName || norm(b.level.name).includes(lName) || lName.includes(norm(b.level.name));
                    return bMatch && lMatch;
                });
            }
            if (!match) {
                const byBranch = allBranches.filter((b) => norm(b.name) === bName);
                if (byBranch.length === 1)
                    match = byBranch[0];
            }
            return match;
        };
        const resolvedItems = [];
        for (let i = 0; i < dto.items.length; i++) {
            const item = dto.items[i];
            if (!item.fullName || !item.fullName.trim()) {
                throw new common_1.BadRequestException(`Baris ${i + 1}: Nama peserta tidak boleh kosong.`);
            }
            const branch = findBranch(item);
            if (!branch) {
                throw new common_1.BadRequestException(`Baris ${i + 1} (${item.fullName}): Cabang lomba "${item.branchName}" (Jenjang: ${item.levelName || '-'}) tidak cocok dengan data cabang lomba di sistem.`);
            }
            resolvedItems.push({ item, branch });
        }
        const createdRegs = await this.prisma.$transaction(async (tx) => {
            const results = [];
            for (const { item, branch } of resolvedItems) {
                const isIndividual = branch.participantType === client_1.ParticipantType.INDIVIDUAL;
                const regId = crypto.randomUUID();
                const regNumber = this.generateRegistrationNumber(isIndividual ? 'IND' : 'TIM');
                const qrToken = this.generateQrToken(regId, regNumber);
                const reg = await tx.registration.create({
                    data: {
                        id: regId,
                        registrationNumber: regNumber,
                        userId: schoolUser.id,
                        branchId: branch.id,
                        status: dto.status,
                        qrCodeToken: qrToken,
                    },
                });
                if (isIndividual) {
                    await tx.individualParticipant.create({
                        data: {
                            registrationId: reg.id,
                            fullName: item.fullName.trim(),
                            gender: item.gender,
                            gradeClass: (item.gradeClass || '-').trim(),
                            schoolName: (item.schoolName || schoolUser.name).trim(),
                            schoolAddress: (item.schoolAddress || '-').trim(),
                            mentorName: (item.mentorName || dto.schoolAccount.mentorName || schoolUser.name).trim(),
                            whatsappNumber: (item.whatsappNumber || dto.schoolAccount.phoneNumber || schoolUser.phoneNumber).trim(),
                        },
                    });
                }
                else {
                    const team = await tx.team.create({
                        data: {
                            registrationId: reg.id,
                            teamName: item.fullName.trim(),
                            schoolName: (item.schoolName || schoolUser.name).trim(),
                            schoolAddress: (item.schoolAddress || '-').trim(),
                            mentorName: (item.mentorName || dto.schoolAccount.mentorName || schoolUser.name).trim(),
                            whatsappNumber: (item.whatsappNumber || dto.schoolAccount.phoneNumber || schoolUser.phoneNumber).trim(),
                            leaderName: item.fullName.trim(),
                        },
                    });
                    await tx.teamMember.create({
                        data: {
                            teamId: team.id,
                            memberName: item.fullName.trim(),
                            gender: item.gender,
                            gradeClass: (item.gradeClass || '-').trim(),
                            positionRole: 'Ketua Tim',
                        },
                    });
                }
                if (dto.status === client_1.RegistrationStatus.APPROVED) {
                    await tx.payment.create({
                        data: {
                            registrationId: reg.id,
                            amount: branch.registrationFee,
                            proofImagePath: 'bulk_import_admin.png',
                            paymentDate: new Date(),
                            status: client_1.PaymentStatus.APPROVED,
                            notes: `Import Kolektif Sekolah: ${schoolUser.name} (${dto.notes || 'Disetujui Admin'})`,
                        },
                    });
                }
                results.push({
                    id: reg.id,
                    registrationNumber: reg.registrationNumber,
                    fullName: item.fullName,
                    branchName: branch.name,
                    levelName: branch.level.name,
                });
            }
            return results;
        });
        await this.auditService.log({
            userId: adminId,
            action: 'BULK_IMPORT_REGISTRATIONS',
            targetTable: 'registrations',
            details: `Import massal ${createdRegs.length} peserta untuk sekolah "${schoolUser.name}" (${schoolUser.email}) dengan status ${dto.status}.`,
        });
        return {
            importedCount: createdRegs.length,
            schoolUser: {
                id: schoolUser.id,
                name: schoolUser.name,
                email: schoolUser.email,
                phoneNumber: schoolUser.phoneNumber,
                plainPassword: dto.schoolAccount.mode === 'new' ? plainPassword : null,
            },
            registrations: createdRegs,
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