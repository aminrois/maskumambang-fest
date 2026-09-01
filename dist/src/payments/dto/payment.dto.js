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
exports.UpdatePaymentAccountDto = exports.CreatePaymentAccountDto = exports.RejectPaymentDto = exports.ReuploadPaymentDto = exports.UploadPaymentDto = void 0;
const class_validator_1 = require("class-validator");
class UploadPaymentDto {
}
exports.UploadPaymentDto = UploadPaymentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'ID Pendaftaran wajib diisi.' }),
    __metadata("design:type", String)
], UploadPaymentDto.prototype, "registrationId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Rekening pembayaran tujuan wajib dipilih.' }),
    __metadata("design:type", String)
], UploadPaymentDto.prototype, "paymentAccountId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UploadPaymentDto.prototype, "senderBank", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", String)
], UploadPaymentDto.prototype, "senderAccountName", void 0);
__decorate([
    (0, class_validator_1.IsDateString)({}, { message: 'Format tanggal pembayaran tidak valid (YYYY-MM-DD).' }),
    __metadata("design:type", String)
], UploadPaymentDto.prototype, "paymentDate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UploadPaymentDto.prototype, "notes", void 0);
class ReuploadPaymentDto {
}
exports.ReuploadPaymentDto = ReuploadPaymentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'ID Pendaftaran wajib diisi.' }),
    __metadata("design:type", String)
], ReuploadPaymentDto.prototype, "registrationId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ReuploadPaymentDto.prototype, "paymentAccountId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], ReuploadPaymentDto.prototype, "senderBank", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", String)
], ReuploadPaymentDto.prototype, "senderAccountName", void 0);
__decorate([
    (0, class_validator_1.IsDateString)({}, { message: 'Format tanggal pembayaran tidak valid (YYYY-MM-DD).' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ReuploadPaymentDto.prototype, "paymentDate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ReuploadPaymentDto.prototype, "notes", void 0);
class RejectPaymentDto {
}
exports.RejectPaymentDto = RejectPaymentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Alasan penolakan pembayaran wajib diisi.' }),
    __metadata("design:type", String)
], RejectPaymentDto.prototype, "rejectionReason", void 0);
class CreatePaymentAccountDto {
}
exports.CreatePaymentAccountDto = CreatePaymentAccountDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nama bank / instansi keuangan wajib diisi.' }),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreatePaymentAccountDto.prototype, "bankName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nomor rekening wajib diisi.' }),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreatePaymentAccountDto.prototype, "accountNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nama pemilik rekening wajib diisi.' }),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", String)
], CreatePaymentAccountDto.prototype, "accountHolder", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreatePaymentAccountDto.prototype, "qrisImagePath", void 0);
class UpdatePaymentAccountDto {
}
exports.UpdatePaymentAccountDto = UpdatePaymentAccountDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UpdatePaymentAccountDto.prototype, "bankName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], UpdatePaymentAccountDto.prototype, "accountNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", String)
], UpdatePaymentAccountDto.prototype, "accountHolder", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdatePaymentAccountDto.prototype, "qrisImagePath", void 0);
//# sourceMappingURL=payment.dto.js.map