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
exports.CheckInService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const config_1 = require("@nestjs/config");
const qr_engine_util_1 = require("../common/utils/qr-engine.util");
const client_1 = require("@prisma/client");
let CheckInService = class CheckInService {
    constructor(prisma, auditService, configService) {
        this.prisma = prisma;
        this.auditService = auditService;
        this.configService = configService;
    }
    async processCheckIn(staffUserId, dto) {
        const cleaned = dto.token.trim();
        const salt = this.configService.get('qr.salt') || 'default_salt';
        const reg = await this.prisma.registration.findFirst({
            where: {
                OR: [
                    { qrCodeToken: cleaned },
                    { registrationNumber: { equals: cleaned, mode: 'insensitive' } },
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
                checkIn: {
                    include: {
                        checkedInBy: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });
        if (!reg) {
            return {
                success: false,
                message: 'Data pendaftaran atau QR Code tidak ditemukan dalam sistem.',
                data: null,
                already_checked_in: false,
            };
        }
        if (reg.status !== client_1.RegistrationStatus.APPROVED) {
            return {
                success: false,
                message: `Pendaftaran ini belum disetujui panitia/bendahara. Status saat ini: ${reg.status}.`,
                data: null,
                already_checked_in: false,
            };
        }
        if (dto.method === client_1.CheckInMethod.QR_SCAN && cleaned.startsWith('REGQR_')) {
            const isValidHmac = qr_engine_util_1.QrEngineUtil.verifyToken(cleaned, reg.id, reg.registrationNumber, salt);
            if (!isValidHmac) {
                await this.auditService.log({
                    userId: staffUserId,
                    action: 'TAMPERED_QR_SCAN_ATTEMPT',
                    targetTable: 'registrations',
                    targetId: reg.id,
                    details: `Percobaan check-in dengan QR palsu / tampered token: ${cleaned}`,
                });
                return {
                    success: false,
                    message: 'QR Code tidak valid atau tanda tangan digital telah dimanipulasi.',
                    data: null,
                    already_checked_in: false,
                };
            }
        }
        if (reg.checkIn) {
            await this.auditService.log({
                userId: staffUserId,
                action: 'DUPLICATE_CHECK_IN_ATTEMPT',
                targetTable: 'check_ins',
                targetId: reg.checkIn.id,
                details: `Percobaan check-in duplikat untuk ${reg.registrationNumber}`,
            });
            return {
                success: false,
                message: `Peserta sudah pernah melakukan check-in sebelumnya pada ${reg.checkIn.checkInTime.toISOString()} oleh petugas ${reg.checkIn.checkedInBy.name}.`,
                data: {
                    registration_number: reg.registrationNumber,
                    participant_name: reg.individualParticipant?.fullName || reg.team?.teamName || 'Peserta',
                    school_name: reg.individualParticipant?.schoolName || reg.team?.schoolName || '-',
                    branch_name: reg.branch.name,
                },
                already_checked_in: true,
                previous_time: reg.checkIn.checkInTime.toISOString(),
                previous_staff: reg.checkIn.checkedInBy.name,
            };
        }
        try {
            const checkInRecord = await this.prisma.checkIn.create({
                data: {
                    registrationId: reg.id,
                    checkedInByUserId: staffUserId,
                    checkInMethod: dto.method,
                    notes: dto.notes?.trim() || `Check-in berhasil via ${dto.method}`,
                },
                include: {
                    checkedInBy: {
                        select: { name: true },
                    },
                },
            });
            await this.auditService.log({
                userId: staffUserId,
                action: 'CHECK_IN_SUCCESS',
                targetTable: 'check_ins',
                targetId: checkInRecord.id,
                details: `Check-in berhasil (${dto.method}) untuk ${reg.registrationNumber}`,
            });
            return {
                success: true,
                message: `Check-in BERHASIL untuk pendaftaran ${reg.registrationNumber}!`,
                data: {
                    registration_number: reg.registrationNumber,
                    participant_name: reg.individualParticipant?.fullName || reg.team?.teamName || 'Peserta',
                    school_name: reg.individualParticipant?.schoolName || reg.team?.schoolName || '-',
                    category_name: reg.branch.level.category.name,
                    level_name: reg.branch.level.name,
                    branch_name: reg.branch.name,
                    participant_type: reg.branch.participantType,
                    check_in_time: checkInRecord.checkInTime.toISOString(),
                    checked_in_by: checkInRecord.checkedInBy.name,
                    method: checkInRecord.checkInMethod,
                },
                already_checked_in: false,
            };
        }
        catch (error) {
            if (error?.code === 'P2002') {
                return {
                    success: false,
                    message: 'Peserta sudah pernah melakukan check-in pada sesi bersamaan.',
                    already_checked_in: true,
                };
            }
            throw error;
        }
    }
    async processCheckIn2(staffUserId, dto) {
        const cleaned = dto.token.trim();
        const salt = this.configService.get('qr.salt') || 'default_salt';
        const reg = await this.prisma.registration.findFirst({
            where: {
                OR: [
                    { qrCodeToken: cleaned },
                    { registrationNumber: { equals: cleaned, mode: 'insensitive' } },
                ],
            },
            include: {
                branch: { include: { level: { include: { category: true } } } },
                individualParticipant: true,
                team: true,
                checkIn: { include: { checkedInBy: { select: { id: true, name: true } } } },
            },
        });
        if (!reg) {
            return { success: false, message: 'Data pendaftaran tidak ditemukan.', data: null };
        }
        if (reg.status !== client_1.RegistrationStatus.APPROVED) {
            return {
                success: false,
                message: `Pendaftaran belum disetujui. Status: ${reg.status}.`,
                data: null,
            };
        }
        if (!reg.checkIn) {
            return {
                success: false,
                message: 'Peserta belum melakukan Check-In Tahap 1 (Kedatangan). Selesaikan dahulu.',
                data: null,
            };
        }
        if (reg.checkIn.checkIn2Time) {
            return {
                success: false,
                message: `Peserta sudah masuk arena pada ${reg.checkIn.checkIn2Time.toISOString()}.`,
                data: {
                    registration_number: reg.registrationNumber,
                    participant_name: reg.individualParticipant?.fullName || reg.team?.teamName || 'Peserta',
                    branch_name: reg.branch.name,
                },
                already_checked_in: true,
            };
        }
        if (dto.method === client_1.CheckInMethod.QR_SCAN && cleaned.startsWith('REGQR_')) {
            const isValid = qr_engine_util_1.QrEngineUtil.verifyToken(cleaned, reg.id, reg.registrationNumber, salt);
            if (!isValid) {
                return { success: false, message: 'QR Code tidak valid atau telah dimanipulasi.', data: null };
            }
        }
        const updated = await this.prisma.checkIn.update({
            where: { registrationId: reg.id },
            data: {
                checkIn2Time: new Date(),
                checkIn2ByUserId: staffUserId,
                checkIn2Method: dto.method,
                notes2: dto.notes?.trim() || `Masuk arena via ${dto.method}`,
            },
            include: { checkedInBy2: { select: { name: true } } },
        });
        await this.auditService.log({
            userId: staffUserId,
            action: 'CHECK_IN_2_SUCCESS',
            targetTable: 'check_ins',
            targetId: updated.id,
            details: `Check-In Tahap 2 (masuk arena) berhasil untuk ${reg.registrationNumber}`,
        });
        return {
            success: true,
            message: `Check-In ARENA BERHASIL untuk ${reg.registrationNumber}!`,
            data: {
                registration_number: reg.registrationNumber,
                participant_name: reg.individualParticipant?.fullName || reg.team?.teamName || 'Peserta',
                school_name: reg.individualParticipant?.schoolName || reg.team?.schoolName || '-',
                category_name: reg.branch.level.category.name,
                level_name: reg.branch.level.name,
                branch_name: reg.branch.name,
                check_in_2_time: updated.checkIn2Time.toISOString(),
                checked_in_by: updated.checkedInBy2?.name || '-',
                stage: 2,
            },
            already_checked_in: false,
        };
    }
    async getLiveCheckInLogs(limit = 50) {
        const records = await this.prisma.checkIn.findMany({
            take: limit,
            orderBy: { checkInTime: 'desc' },
            include: {
                checkedInBy: { select: { name: true } },
                checkedInBy2: { select: { name: true } },
                registration: {
                    include: {
                        branch: true,
                        individualParticipant: true,
                        team: true,
                    },
                },
            },
        });
        return records.map((r) => ({
            id: r.id,
            registration_number: r.registration.registrationNumber,
            participant_name: r.registration.individualParticipant?.fullName ||
                r.registration.team?.teamName ||
                'Peserta',
            school_name: r.registration.individualParticipant?.schoolName ||
                r.registration.team?.schoolName ||
                '-',
            branch_name: r.registration.branch.name,
            check_in_time: r.checkInTime.toISOString(),
            checked_in_by_name: r.checkedInBy.name,
            check_in_method: r.checkInMethod,
            check_in_2_time: r.checkIn2Time?.toISOString() || null,
            checked_in_2_by_name: r.checkedInBy2?.name || null,
            check_in_2_method: r.checkIn2Method || null,
        }));
    }
};
exports.CheckInService = CheckInService;
exports.CheckInService = CheckInService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        config_1.ConfigService])
], CheckInService);
//# sourceMappingURL=checkin.service.js.map