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
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const config_1 = require("@nestjs/config");
const file_validator_util_1 = require("../common/utils/file-validator.util");
const client_1 = require("@prisma/client");
const fs = require("fs");
const path = require("path");
let PaymentsService = class PaymentsService {
    constructor(prisma, auditService, configService) {
        this.prisma = prisma;
        this.auditService = auditService;
        this.configService = configService;
        const baseUpload = this.configService.get('upload.folder') || 'uploads';
        this.uploadDir = path.resolve(process.cwd(), baseUpload, 'payment_proofs');
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }
    async getActiveAccounts() {
        return this.prisma.paymentAccount.findMany({
            where: { isActive: true },
            orderBy: { bankName: 'asc' },
        });
    }
    async getAllAccounts() {
        return this.prisma.paymentAccount.findMany({
            orderBy: { bankName: 'asc' },
        });
    }
    async createAccount(dto) {
        return this.prisma.paymentAccount.create({
            data: {
                bankName: dto.bankName.trim(),
                accountNumber: dto.accountNumber.trim(),
                accountHolder: dto.accountHolder.trim(),
                isActive: true,
            },
        });
    }
    async updateAccount(id, dto) {
        const account = await this.prisma.paymentAccount.findUnique({ where: { id } });
        if (!account) {
            throw new common_1.NotFoundException('Rekening pembayaran tidak ditemukan.');
        }
        return this.prisma.paymentAccount.update({
            where: { id },
            data: {
                bankName: dto.bankName?.trim(),
                accountNumber: dto.accountNumber?.trim(),
                accountHolder: dto.accountHolder?.trim(),
            },
        });
    }
    async deleteAccount(id) {
        const account = await this.prisma.paymentAccount.findUnique({
            where: { id },
        });
        if (!account) {
            throw new common_1.NotFoundException('Rekening pembayaran tidak ditemukan.');
        }
        await this.prisma.payment.updateMany({
            where: { paymentAccountId: id },
            data: { paymentAccountId: null },
        });
        return this.prisma.paymentAccount.delete({
            where: { id },
        });
    }
    async toggleAccount(id) {
        const account = await this.prisma.paymentAccount.findUnique({ where: { id } });
        if (!account) {
            throw new common_1.NotFoundException('Rekening pembayaran tidak ditemukan.');
        }
        return this.prisma.paymentAccount.update({
            where: { id },
            data: { isActive: !account.isActive },
        });
    }
    async uploadPayment(userId, dto, fileBuffer, originalFilename) {
        const reg = await this.prisma.registration.findUnique({
            where: { id: dto.registrationId },
            include: { branch: true },
        });
        if (!reg) {
            throw new common_1.NotFoundException('Data pendaftaran tidak ditemukan.');
        }
        if (reg.userId !== userId) {
            throw new common_1.ForbiddenException('Akses ditolak: Anda bukan pemilik pendaftaran ini.');
        }
        const account = await this.prisma.paymentAccount.findUnique({
            where: { id: dto.paymentAccountId },
        });
        if (!account || !account.isActive) {
            throw new common_1.BadRequestException('Rekening bank pembayaran tidak valid atau sedang tidak aktif.');
        }
        const validatedFile = file_validator_util_1.FileValidatorUtil.validateImageBuffer(fileBuffer, originalFilename);
        const diskPath = path.join(this.uploadDir, validatedFile.storageFilename);
        await fs.promises.writeFile(diskPath, fileBuffer);
        const actualFee = reg.branch.registrationFee;
        const payment = await this.prisma.$transaction(async (tx) => {
            const p = await tx.payment.create({
                data: {
                    registrationId: reg.id,
                    paymentAccountId: account.id,
                    amount: actualFee,
                    proofImagePath: validatedFile.storageFilename,
                    senderBank: dto.senderBank?.trim(),
                    senderAccountName: dto.senderAccountName?.trim(),
                    paymentDate: new Date(dto.paymentDate),
                    status: client_1.PaymentStatus.WAITING_VERIFICATION,
                    notes: dto.notes?.trim(),
                },
            });
            await tx.registration.update({
                where: { id: reg.id },
                data: { status: client_1.RegistrationStatus.WAITING_VERIFICATION },
            });
            return p;
        });
        await this.auditService.log({
            userId,
            action: 'UPLOAD_PAYMENT',
            targetTable: 'payments',
            targetId: payment.id,
            details: `Upload bukti pembayaran untuk pendaftaran ${reg.registrationNumber} (Nominal: Rp ${actualFee})`,
        });
        return payment;
    }
    async reuploadPayment(userId, dto, fileBuffer, originalFilename) {
        const reg = await this.prisma.registration.findUnique({
            where: { id: dto.registrationId },
            include: { branch: true },
        });
        if (!reg) {
            throw new common_1.NotFoundException('Data pendaftaran tidak ditemukan.');
        }
        if (reg.userId !== userId) {
            throw new common_1.ForbiddenException('Akses ditolak: Anda bukan pemilik pendaftaran ini.');
        }
        if (reg.status !== client_1.RegistrationStatus.PAYMENT_REJECTED) {
            throw new common_1.BadRequestException('Upload ulang bukti hanya diperbolehkan untuk pendaftaran berstatus Pembayaran Ditolak (PAYMENT_REJECTED).');
        }
        let accountId = dto.paymentAccountId;
        if (!accountId) {
            const prevPayment = await this.prisma.payment.findFirst({
                where: { registrationId: reg.id },
                orderBy: { createdAt: 'desc' },
            });
            accountId = prevPayment?.paymentAccountId || undefined;
        }
        const account = accountId
            ? await this.prisma.paymentAccount.findUnique({ where: { id: accountId } })
            : await this.prisma.paymentAccount.findFirst({ where: { isActive: true } });
        if (!account || !account.isActive) {
            throw new common_1.BadRequestException('Rekening bank pembayaran tidak valid.');
        }
        const validatedFile = file_validator_util_1.FileValidatorUtil.validateImageBuffer(fileBuffer, originalFilename);
        const diskPath = path.join(this.uploadDir, validatedFile.storageFilename);
        await fs.promises.writeFile(diskPath, fileBuffer);
        const actualFee = reg.branch.registrationFee;
        const payment = await this.prisma.$transaction(async (tx) => {
            const p = await tx.payment.create({
                data: {
                    registrationId: reg.id,
                    paymentAccountId: account.id,
                    amount: actualFee,
                    proofImagePath: validatedFile.storageFilename,
                    senderBank: dto.senderBank?.trim(),
                    senderAccountName: dto.senderAccountName?.trim(),
                    paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
                    status: client_1.PaymentStatus.WAITING_VERIFICATION,
                    notes: `Re-upload: ${dto.notes?.trim() || '-'}`,
                },
            });
            await tx.registration.update({
                where: { id: reg.id },
                data: { status: client_1.RegistrationStatus.WAITING_VERIFICATION },
            });
            return p;
        });
        await this.auditService.log({
            userId,
            action: 'REUPLOAD_PAYMENT',
            targetTable: 'payments',
            targetId: payment.id,
            details: `Upload ulang bukti pembayaran untuk pendaftaran ${reg.registrationNumber}`,
        });
        return payment;
    }
    async listPayments(status, search, page = 1, perPage = 25) {
        const skip = (page - 1) * perPage;
        const where = {};
        if (status) {
            where.status = status;
        }
        if (search && search.trim()) {
            const q = search.trim();
            where.OR = [
                { senderAccountName: { contains: q, mode: 'insensitive' } },
                { senderBank: { contains: q, mode: 'insensitive' } },
                { registration: { registrationNumber: { contains: q, mode: 'insensitive' } } },
                {
                    registration: {
                        individualParticipant: { fullName: { contains: q, mode: 'insensitive' } },
                    },
                },
                { registration: { team: { teamName: { contains: q, mode: 'insensitive' } } } },
            ];
        }
        const [payments, total] = await Promise.all([
            this.prisma.payment.findMany({
                where,
                include: {
                    paymentAccount: true,
                    registration: {
                        include: {
                            branch: { include: { level: { include: { category: true } } } },
                            individualParticipant: true,
                            team: true,
                            user: { select: { id: true, name: true, email: true, phoneNumber: true } },
                        },
                    },
                    verificationLogs: {
                        include: { verifiedBy: { select: { id: true, name: true } } },
                        orderBy: { verifiedAt: 'desc' },
                    },
                },
                skip,
                take: perPage,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.payment.count({ where }),
        ]);
        return {
            payments,
            pagination: {
                total,
                page,
                perPage,
                totalPages: Math.ceil(total / perPage),
            },
        };
    }
    async approvePayment(paymentId, staffId) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
            include: { registration: true },
        });
        if (!payment) {
            throw new common_1.NotFoundException('Data pembayaran tidak ditemukan.');
        }
        const updated = await this.prisma.$transaction(async (tx) => {
            const p = await tx.payment.update({
                where: { id: paymentId },
                data: { status: client_1.PaymentStatus.APPROVED },
            });
            await tx.registration.update({
                where: { id: payment.registrationId },
                data: { status: client_1.RegistrationStatus.APPROVED },
            });
            await tx.paymentVerificationLog.create({
                data: {
                    paymentId: payment.id,
                    verifiedByUserId: staffId,
                    action: client_1.VerificationAction.APPROVED,
                    rejectionReason: null,
                },
            });
            return p;
        });
        await this.auditService.log({
            userId: staffId,
            action: 'APPROVE_PAYMENT',
            targetTable: 'payments',
            targetId: payment.id,
            details: `Persetujuan pembayaran pendaftaran ${payment.registration.registrationNumber}`,
        });
        return updated;
    }
    async rejectPayment(paymentId, staffId, dto) {
        if (!dto.rejectionReason || !dto.rejectionReason.trim()) {
            throw new common_1.BadRequestException('Alasan penolakan pembayaran WAJIB diisi.');
        }
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
            include: { registration: true },
        });
        if (!payment) {
            throw new common_1.NotFoundException('Data pembayaran tidak ditemukan.');
        }
        const updated = await this.prisma.$transaction(async (tx) => {
            const p = await tx.payment.update({
                where: { id: paymentId },
                data: { status: client_1.PaymentStatus.REJECTED },
            });
            await tx.registration.update({
                where: { id: payment.registrationId },
                data: { status: client_1.RegistrationStatus.PAYMENT_REJECTED },
            });
            await tx.paymentVerificationLog.create({
                data: {
                    paymentId: payment.id,
                    verifiedByUserId: staffId,
                    action: client_1.VerificationAction.REJECTED,
                    rejectionReason: dto.rejectionReason.trim(),
                },
            });
            return p;
        });
        await this.auditService.log({
            userId: staffId,
            action: 'REJECT_PAYMENT',
            targetTable: 'payments',
            targetId: payment.id,
            details: `Penolakan pembayaran pendaftaran ${payment.registration.registrationNumber}. Alasan: ${dto.rejectionReason.trim()}`,
        });
        return updated;
    }
    async getPaymentProofFile(filename, requesterUserId, requesterRole) {
        const sanitized = file_validator_util_1.FileValidatorUtil.sanitizeFilename(filename);
        const candidatePaths = [
            path.join(this.uploadDir, sanitized),
            path.resolve(process.cwd(), 'uploads/payment_proofs', sanitized),
            path.resolve(process.cwd(), '../uploads/payment_proofs', sanitized),
            path.resolve(process.cwd(), 'uploads', sanitized),
            path.resolve(process.cwd(), '../uploads', sanitized),
            path.resolve(process.cwd(), 'public/uploads/payment_proofs', sanitized),
        ];
        const filePath = candidatePaths.find((p) => fs.existsSync(p));
        if (!filePath) {
            throw new common_1.NotFoundException('File bukti pembayaran tidak ditemukan.');
        }
        const payment = await this.prisma.payment.findFirst({
            where: { proofImagePath: sanitized },
            include: { registration: true },
        });
        if (payment && requesterRole === client_1.Role.PESERTA && payment.registration.userId !== requesterUserId) {
            throw new common_1.ForbiddenException('Akses ditolak: Anda tidak berhak mengakses bukti pembayaran ini.');
        }
        return {
            filePath,
            filename: sanitized,
        };
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        config_1.ConfigService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map