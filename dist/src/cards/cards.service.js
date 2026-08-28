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
exports.CardsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const qr_engine_util_1 = require("../common/utils/qr-engine.util");
const client_1 = require("@prisma/client");
let CardsService = class CardsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getParticipantCard(registrationId, requesterUserId, requesterRole) {
        const reg = await this.prisma.registration.findUnique({
            where: { id: registrationId },
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
                        members: {
                            orderBy: { createdAt: 'asc' },
                        },
                    },
                },
            },
        });
        if (!reg) {
            throw new common_1.NotFoundException('Data pendaftaran tidak ditemukan.');
        }
        if (requesterRole === client_1.Role.PESERTA && reg.userId !== requesterUserId) {
            throw new common_1.ForbiddenException('Akses ditolak: Anda tidak memiliki izin melihat kartu ini.');
        }
        if (reg.status !== client_1.RegistrationStatus.APPROVED) {
            throw new common_1.BadRequestException(`Kartu peserta hanya dapat diakses setelah pembayaran disetujui. Status saat ini: ${reg.status}`);
        }
        const qrDataUri = await qr_engine_util_1.QrEngineUtil.generateQrDataUri(reg.qrCodeToken);
        const settings = await this.prisma.appSetting.findMany();
        const brandingMap = {};
        settings.forEach((s) => {
            if (s.value)
                brandingMap[s.key] = s.value;
        });
        const participantName = reg.individualParticipant?.fullName || reg.team?.teamName || 'Peserta Resmi';
        const schoolName = reg.individualParticipant?.schoolName || reg.team?.schoolName || '-';
        return {
            registration_number: reg.registrationNumber,
            participant_name: participantName,
            school_name: schoolName,
            category_name: reg.branch.level.category.name,
            level_name: reg.branch.level.name,
            branch_name: reg.branch.name,
            participant_type: reg.branch.participantType,
            mentor_name: reg.individualParticipant?.mentorName || reg.team?.mentorName || '-',
            leader_name: reg.team?.leaderName || null,
            members: reg.team?.members || [],
            qr_data_uri: qrDataUri,
            qr_code_token: reg.qrCodeToken,
            status: reg.status,
            app_title: brandingMap['application_name'] || 'SISTEM PENDAFTARAN LOMBA',
            app_short_name: brandingMap['application_short_name'] || 'MASKUMAMBANG FEST #4',
            logo_url: brandingMap['app_logo_path'] || '/static/img/logo_e7a8b6a95d.webp',
        };
    }
};
exports.CardsService = CardsService;
exports.CardsService = CardsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CardsService);
//# sourceMappingURL=cards.service.js.map