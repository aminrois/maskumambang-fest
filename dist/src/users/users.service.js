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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const hash_util_1 = require("../common/utils/hash.util");
const client_1 = require("@prisma/client");
let UsersService = class UsersService {
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async findById(id) {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }
    async findByEmail(email) {
        return this.prisma.user.findUnique({
            where: { email: email.trim().toLowerCase() },
        });
    }
    async createUser(staffId, dto) {
        const existing = await this.findByEmail(dto.email);
        if (existing) {
            throw new common_1.BadRequestException('Email sudah terdaftar.');
        }
        const passwordHash = await hash_util_1.HashUtil.hashPassword(dto.password);
        const user = await this.prisma.user.create({
            data: {
                name: dto.name.trim(),
                email: dto.email.trim().toLowerCase(),
                phoneNumber: dto.phoneNumber.trim(),
                passwordHash,
                role: dto.role || client_1.Role.PESERTA,
                isActive: true,
            },
        });
        await this.auditService.log({
            userId: staffId,
            action: 'ADMIN_CREATE_USER',
            targetTable: 'users',
            targetId: user.id,
            details: `Admin membuat user baru: ${user.name} (${user.email}) dengan role ${user.role}`,
        });
        const { passwordHash: _, ...safeUser } = user;
        return safeUser;
    }
    async listUsers(search, role, isActive, page = 1, perPage = 25) {
        const skip = (page - 1) * perPage;
        const where = {};
        if (role) {
            where.role = role;
        }
        if (isActive !== undefined) {
            where.isActive = isActive;
        }
        if (search && search.trim()) {
            const q = search.trim();
            where.OR = [
                { name: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
                { phoneNumber: { contains: q, mode: 'insensitive' } },
            ];
        }
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phoneNumber: true,
                    role: true,
                    isActive: true,
                    sessionVersion: true,
                    createdAt: true,
                    updatedAt: true,
                },
                skip,
                take: perPage,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count({ where }),
        ]);
        return {
            users,
            pagination: {
                total,
                page,
                perPage,
                totalPages: Math.ceil(total / perPage),
            },
        };
    }
    async toggleActiveStatus(userId, staffId) {
        const user = await this.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('Pengguna tidak ditemukan.');
        }
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: {
                isActive: !user.isActive,
                sessionVersion: { increment: 1 },
            },
        });
        if (staffId) {
            await this.auditService.log({
                userId: staffId,
                action: 'TOGGLE_USER_STATUS',
                targetTable: 'users',
                targetId: user.id,
                details: `Status akun ${user.email} diubah menjadi: ${updated.isActive ? 'AKTIF' : 'NONAKTIF'}`,
            });
        }
        return updated;
    }
    async changeRole(userId, newRole, staffId) {
        const user = await this.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('Pengguna tidak ditemukan.');
        }
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: {
                role: newRole,
                sessionVersion: { increment: 1 },
            },
        });
        if (staffId) {
            await this.auditService.log({
                userId: staffId,
                action: 'CHANGE_USER_ROLE',
                targetTable: 'users',
                targetId: user.id,
                details: `Role akun ${user.email} diubah dari ${user.role} menjadi ${newRole}`,
            });
        }
        return updated;
    }
    async changePassword(userId, dto) {
        const user = await this.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('Pengguna tidak ditemukan.');
        }
        const isMatch = await hash_util_1.HashUtil.verifyPassword(dto.currentPassword, user.passwordHash);
        if (!isMatch) {
            throw new common_1.BadRequestException('Kata sandi saat ini tidak cocok.');
        }
        const newHash = await hash_util_1.HashUtil.hashPassword(dto.newPassword);
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash: newHash,
                sessionVersion: { increment: 1 },
            },
        });
        await this.auditService.log({
            userId,
            action: 'CHANGE_PASSWORD',
            targetTable: 'users',
            targetId: userId,
            details: 'Pengguna berhasil mengubah kata sandinya sendiri.',
        });
        return { success: true, message: 'Kata sandi berhasil diperbarui.' };
    }
    async resetPassword(staffId, targetUserId, dto) {
        const user = await this.findById(targetUserId);
        if (!user) {
            throw new common_1.NotFoundException('Pengguna target tidak ditemukan.');
        }
        const newHash = await hash_util_1.HashUtil.hashPassword(dto.newPassword);
        await this.prisma.user.update({
            where: { id: targetUserId },
            data: {
                passwordHash: newHash,
                sessionVersion: { increment: 1 },
            },
        });
        await this.auditService.log({
            userId: staffId,
            action: 'RESET_USER_PASSWORD',
            targetTable: 'users',
            targetId: targetUserId,
            details: `Super Admin mereset password untuk pengguna: ${user.email}`,
        });
        return {
            success: true,
            message: `Kata sandi untuk ${user.email} berhasil direset.`,
        };
    }
    async deleteUser(staffId, targetUserId) {
        if (staffId === targetUserId) {
            throw new common_1.BadRequestException('Anda tidak dapat menghapus akun Anda sendiri.');
        }
        const user = await this.findById(targetUserId);
        if (!user) {
            throw new common_1.NotFoundException('Pengguna tidak ditemukan.');
        }
        await this.prisma.$transaction(async (tx) => {
            const regs = await tx.registration.findMany({
                where: { userId: targetUserId },
                select: { id: true },
            });
            const regIds = regs.map((r) => r.id);
            if (regIds.length > 0) {
                await tx.checkIn.deleteMany({ where: { registrationId: { in: regIds } } });
                const payments = await tx.payment.findMany({
                    where: { registrationId: { in: regIds } },
                    select: { id: true },
                });
                const payIds = payments.map((p) => p.id);
                if (payIds.length > 0) {
                    await tx.paymentVerificationLog.deleteMany({ where: { paymentId: { in: payIds } } });
                }
                await tx.payment.deleteMany({ where: { registrationId: { in: regIds } } });
                await tx.individualParticipant.deleteMany({ where: { registrationId: { in: regIds } } });
                const teams = await tx.team.findMany({
                    where: { registrationId: { in: regIds } },
                    select: { id: true },
                });
                const teamIds = teams.map((t) => t.id);
                if (teamIds.length > 0) {
                    await tx.teamMember.deleteMany({ where: { teamId: { in: teamIds } } });
                }
                await tx.team.deleteMany({ where: { registrationId: { in: regIds } } });
                await tx.registration.deleteMany({ where: { id: { in: regIds } } });
            }
            await tx.paymentVerificationLog.deleteMany({
                where: { verifiedByUserId: targetUserId },
            });
            await tx.auditLog.deleteMany({ where: { userId: targetUserId } });
            await tx.user.delete({ where: { id: targetUserId } });
        });
        await this.auditService.log({
            userId: staffId,
            action: 'ADMIN_DELETE_USER',
            targetTable: 'users',
            targetId: targetUserId,
            details: `Super Admin menghapus pengguna: ${user.name} (${user.email})`,
        });
        return {
            success: true,
            message: `Pengguna ${user.name} (${user.email}) berhasil dihapus.`,
        };
    }
    async bulkDeleteUsers(staffId, userIds) {
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            throw new common_1.BadRequestException('Pilih setidaknya satu pengguna untuk dihapus.');
        }
        const validIds = userIds.filter((id) => id !== staffId);
        if (validIds.length === 0) {
            throw new common_1.BadRequestException('Tidak ada pengguna yang valid untuk dihapus (tidak dapat menghapus akun sendiri).');
        }
        let deletedCount = 0;
        for (const id of validIds) {
            try {
                await this.deleteUser(staffId, id);
                deletedCount++;
            }
            catch (err) {
            }
        }
        return {
            success: true,
            message: `${deletedCount} pengguna berhasil dihapus.`,
            deletedCount,
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], UsersService);
//# sourceMappingURL=users.service.js.map