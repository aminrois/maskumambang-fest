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
exports.CreateIndividualRegistrationDto = void 0;
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class CreateIndividualRegistrationDto {
}
exports.CreateIndividualRegistrationDto = CreateIndividualRegistrationDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'ID Cabang lomba wajib diisi.' }),
    __metadata("design:type", String)
], CreateIndividualRegistrationDto.prototype, "branchId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nama lengkap peserta wajib diisi.' }),
    (0, class_validator_1.MaxLength)(150, { message: 'Nama maksimal 150 karakter.' }),
    __metadata("design:type", String)
], CreateIndividualRegistrationDto.prototype, "fullName", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.Gender, { message: 'Jenis kelamin harus L (Laki-laki) atau P (Perempuan).' }),
    __metadata("design:type", String)
], CreateIndividualRegistrationDto.prototype, "gender", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Kelas / Tingkat wajib diisi.' }),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateIndividualRegistrationDto.prototype, "gradeClass", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nama asal sekolah wajib diisi.' }),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateIndividualRegistrationDto.prototype, "schoolName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Alamat sekolah wajib diisi.' }),
    __metadata("design:type", String)
], CreateIndividualRegistrationDto.prototype, "schoolAddress", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nama guru pembimbing wajib diisi.' }),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", String)
], CreateIndividualRegistrationDto.prototype, "mentorName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nomor WhatsApp wajib diisi.' }),
    (0, class_validator_1.MaxLength)(30),
    __metadata("design:type", String)
], CreateIndividualRegistrationDto.prototype, "whatsappNumber", void 0);
//# sourceMappingURL=create-individual.dto.js.map