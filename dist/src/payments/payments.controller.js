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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const payments_service_1 = require("./payments.service");
const payment_dto_1 = require("./dto/payment.dto");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const public_decorator_1 = require("../common/decorators/public.decorator");
const client_1 = require("@prisma/client");
let PaymentsController = class PaymentsController {
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
    }
    async getActiveAccounts() {
        const accounts = await this.paymentsService.getActiveAccounts();
        return { success: true, data: accounts };
    }
    async getAllAccounts() {
        const accounts = await this.paymentsService.getAllAccounts();
        return { success: true, data: accounts };
    }
    async createAccount(dto) {
        const created = await this.paymentsService.createAccount(dto);
        return { success: true, message: 'Rekening pembayaran berhasil ditambahkan.', data: created };
    }
    async updateAccount(id, dto) {
        const updated = await this.paymentsService.updateAccount(id, dto);
        return { success: true, message: 'Rekening pembayaran berhasil diperbarui.', data: updated };
    }
    async uploadQrisImage(accountId, file) {
        if (!file || !file.buffer) {
            throw new common_1.BadRequestException('File gambar QRIS (qris_image) wajib diunggah.');
        }
        const result = await this.paymentsService.uploadQrisImage(accountId, file.buffer, file.originalname);
        return { success: true, message: 'Gambar QRIS berhasil diunggah.', data: result };
    }
    async deleteQrisImage(accountId) {
        await this.paymentsService.deleteQrisImage(accountId);
        return { success: true, message: 'Gambar QRIS berhasil dihapus.' };
    }
    async serveQrisImage(filename, res) {
        const { filePath } = await this.paymentsService.getQrisImageFile(filename);
        return res.sendFile(filePath);
    }
    async deleteAccount(id) {
        const deleted = await this.paymentsService.deleteAccount(id);
        return { success: true, message: 'Rekening pembayaran berhasil dihapus.', data: deleted };
    }
    async toggleAccount(id) {
        const toggled = await this.paymentsService.toggleAccount(id);
        return {
            success: true,
            message: `Status rekening diubah menjadi: ${toggled.isActive ? 'AKTIF' : 'NONAKTIF'}`,
            data: toggled,
        };
    }
    async uploadPayment(userId, dto, file) {
        if (!file || !file.buffer) {
            throw new common_1.BadRequestException('File bukti pembayaran (payment_proof) wajib diunggah.');
        }
        const payment = await this.paymentsService.uploadPayment(userId, dto, file.buffer, file.originalname);
        return {
            success: true,
            message: 'Bukti pembayaran berhasil diunggah dan sedang menunggu verifikasi panitia.',
            data: payment,
        };
    }
    async reuploadPayment(userId, dto, file) {
        if (!file || !file.buffer) {
            throw new common_1.BadRequestException('File bukti pembayaran baru (payment_proof) wajib diunggah.');
        }
        const payment = await this.paymentsService.reuploadPayment(userId, dto, file.buffer, file.originalname);
        return {
            success: true,
            message: 'Bukti pembayaran baru berhasil dikirim dan menunggu verifikasi ulang.',
            data: payment,
        };
    }
    async listPayments(status, search, page = '1', perPage = '25') {
        const data = await this.paymentsService.listPayments(status, search, parseInt(page, 10) || 1, parseInt(perPage, 10) || 25);
        return { success: true, ...data };
    }
    async approvePayment(paymentId, staffId) {
        const payment = await this.paymentsService.approvePayment(paymentId, staffId);
        return {
            success: true,
            message: 'Pembayaran BERHASIL disetujui! Kartu peserta & QR Code kini aktif.',
            data: payment,
        };
    }
    async rejectPayment(paymentId, staffId, dto) {
        const payment = await this.paymentsService.rejectPayment(paymentId, staffId, dto);
        return {
            success: true,
            message: 'Pembayaran telah DITOLAK. Peserta dapat mengunggah bukti perbaikan.',
            data: payment,
        };
    }
    async streamPaymentProof(filename, userId, role, res) {
        const { filePath } = await this.paymentsService.getPaymentProofFile(filename, userId, role);
        return res.sendFile(filePath);
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('accounts'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getActiveAccounts", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN),
    (0, common_1.Get)('accounts/all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getAllAccounts", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)('accounts'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [payment_dto_1.CreatePaymentAccountDto]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "createAccount", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN),
    (0, common_1.Patch)('accounts/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "updateAccount", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)('accounts/:id/qris'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('qris_image')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "uploadQrisImage", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN),
    (0, common_1.Delete)('accounts/:id/qris'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "deleteQrisImage", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('accounts/qris/:filename'),
    __param(0, (0, common_1.Param)('filename')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "serveQrisImage", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN),
    (0, common_1.Delete)('accounts/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "deleteAccount", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN),
    (0, common_1.Patch)('accounts/:id/toggle'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "toggleAccount", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.PESERTA),
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('payment_proof')),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, payment_dto_1.UploadPaymentDto, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "uploadPayment", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.PESERTA),
    (0, common_1.Post)('reupload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('payment_proof')),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, payment_dto_1.ReuploadPaymentDto, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "reuploadPayment", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.BENDAHARA, client_1.Role.SUPER_ADMIN),
    (0, common_1.Get)('list'),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('perPage')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "listPayments", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.BENDAHARA, client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)(':id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "approvePayment", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.BENDAHARA, client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)(':id/reject'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, payment_dto_1.RejectPaymentDto]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "rejectPayment", null);
__decorate([
    (0, common_1.Get)('file/:filename'),
    __param(0, (0, common_1.Param)('filename')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "streamPaymentProof", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, common_1.Controller)('payments'),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map