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
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const config_1 = require("@nestjs/config");
let SettingsService = class SettingsService {
    constructor(prisma, auditService, configService) {
        this.prisma = prisma;
        this.auditService = auditService;
        this.configService = configService;
    }
    async getSettings() {
        const settings = await this.prisma.appSetting.findMany();
        const map = {
            application_name: 'MASKUMAMBANG FEST #4',
            application_short_name: 'MASKUMAMBANG FEST #4',
            application_description: 'Ajang Kompetisi Tingkat Nasional Paling Bergengsi Tahun 2026.',
            application_logo: 'logo_e7a8b6a95d.webp',
            application_favicon: 'favicon_87007b6344.webp',
            countdown_enabled: 'true',
            countdown_title: 'Hitung Mundur Penutupan Pendaftaran',
            countdown_target_date: '2026-10-15T23:59:00',
            countdown_ended_text: 'Pendaftaran Resmi Ditutup',
        };
        settings.forEach((s) => {
            if (s.value !== null && s.value !== undefined) {
                map[s.key] = s.value;
            }
        });
        return map;
    }
    async updateSettings(staffUserId, dto) {
        const entries = Object.entries(dto).filter(([_, val]) => val !== undefined);
        for (const [key, value] of entries) {
            await this.prisma.appSetting.upsert({
                where: { key },
                update: { value },
                create: { key, value },
            });
        }
        await this.auditService.log({
            userId: staffUserId,
            action: 'UPDATE_SETTINGS',
            targetTable: 'app_settings',
            details: `Perubahan branding aplikasi: ${entries.map(([k, v]) => `${k}=${v}`).join(', ')}`,
        });
        return this.getSettings();
    }
    async uploadBrandingFile(staffUserId, file, type) {
        if (!file || !file.buffer) {
            throw new common_1.BadRequestException('File tidak ditemukan.');
        }
        const ext = path.extname(file.originalname).toLowerCase().replace('.', '') || 'webp';
        const hash = crypto.randomBytes(5).toString('hex');
        const filename = `${type}_${hash}.${ext}`;
        const targetDirs = [
            path.resolve(process.cwd(), 'public/static/img'),
            path.resolve(process.cwd(), 'public/uploads/branding'),
            path.resolve(process.cwd(), 'uploads/branding'),
            path.resolve(process.cwd(), '../uploads/branding'),
        ];
        for (const dir of targetDirs) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(path.join(dir, filename), file.buffer);
        }
        const settingKey = type === 'logo' ? 'application_logo' : 'application_favicon';
        await this.prisma.appSetting.upsert({
            where: { key: settingKey },
            update: { value: filename },
            create: { key: settingKey, value: filename },
        });
        await this.auditService.log({
            userId: staffUserId,
            action: `UPLOAD_${type.toUpperCase()}`,
            targetTable: 'app_settings',
            details: `Super Admin memperbarui ${type}: ${filename}`,
        });
        return {
            success: true,
            filename,
            url: `/static/img/${filename}`,
        };
    }
    async resetOperationalData(staffUserId, dto) {
        const validCode = this.configService.get('reset.code') || 'RESET124';
        if (dto.confirmationCode.trim() !== validCode.trim()) {
            throw new common_1.ForbiddenException('Kode konfirmasi reset tidak valid. Tindakan berbahaya ini dibatalkan.');
        }
        const stats = await this.prisma.$transaction(async (tx) => {
            const checkIns = await tx.checkIn.deleteMany({});
            const logs = await tx.paymentVerificationLog.deleteMany({});
            const payments = await tx.payment.deleteMany({});
            const teamMembers = await tx.teamMember.deleteMany({});
            const teams = await tx.team.deleteMany({});
            const indivs = await tx.individualParticipant.deleteMany({});
            const registrations = await tx.registration.deleteMany({});
            const pesertaUsers = await tx.user.findMany({
                where: { role: 'PESERTA' },
                select: { id: true },
            });
            const pesertaIds = pesertaUsers.map((u) => u.id);
            if (pesertaIds.length > 0) {
                await tx.auditLog.deleteMany({
                    where: { userId: { in: pesertaIds } },
                });
            }
            const deletedPeserta = await tx.user.deleteMany({
                where: { role: 'PESERTA' },
            });
            return {
                checkIns: checkIns.count,
                verificationLogs: logs.count,
                payments: payments.count,
                teamMembers: teamMembers.count,
                teams: teams.count,
                individualParticipants: indivs.count,
                registrations: registrations.count,
                deletedPesertaUsers: deletedPeserta.count,
            };
        });
        await this.auditService.log({
            userId: staffUserId,
            action: 'RESET_OPERATIONAL_DATA',
            targetTable: 'system',
            details: `Super Admin melakukan reset data operasional lomba: ${stats.registrations} registrasi, ${stats.payments} pembayaran, dan ${stats.deletedPesertaUsers} akun peserta dibersihkan.`,
        });
        return {
            success: true,
            message: `Seluruh data transaksi (${stats.registrations} pendaftaran) dan ${stats.deletedPesertaUsers} akun peserta berhasil dibersihkan. Akun admin dan master data lomba tetap aman.`,
            stats,
        };
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        config_1.ConfigService])
], SettingsService);
//# sourceMappingURL=settings.service.js.map