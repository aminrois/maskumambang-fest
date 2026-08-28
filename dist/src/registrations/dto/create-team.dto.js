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
exports.CreateTeamRegistrationDto = exports.TeamMemberDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
class TeamMemberDto {
}
exports.TeamMemberDto = TeamMemberDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nama anggota tim wajib diisi.' }),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", String)
], TeamMemberDto.prototype, "memberName", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.Gender, { message: 'Jenis kelamin anggota harus L atau P.' }),
    __metadata("design:type", String)
], TeamMemberDto.prototype, "gender", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Kelas anggota wajib diisi.' }),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], TeamMemberDto.prototype, "gradeClass", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], TeamMemberDto.prototype, "positionRole", void 0);
class CreateTeamRegistrationDto {
}
exports.CreateTeamRegistrationDto = CreateTeamRegistrationDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'ID Cabang lomba wajib diisi.' }),
    __metadata("design:type", String)
], CreateTeamRegistrationDto.prototype, "branchId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nama tim wajib diisi.' }),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", String)
], CreateTeamRegistrationDto.prototype, "teamName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nama asal sekolah wajib diisi.' }),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateTeamRegistrationDto.prototype, "schoolName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Alamat sekolah wajib diisi.' }),
    __metadata("design:type", String)
], CreateTeamRegistrationDto.prototype, "schoolAddress", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nama guru pembimbing / pelatih wajib diisi.' }),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", String)
], CreateTeamRegistrationDto.prototype, "mentorName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nomor WhatsApp kontak tim wajib diisi.' }),
    (0, class_validator_1.MaxLength)(30),
    __metadata("design:type", String)
], CreateTeamRegistrationDto.prototype, "whatsappNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nama ketua tim wajib diisi.' }),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", String)
], CreateTeamRegistrationDto.prototype, "leaderName", void 0);
__decorate([
    (0, class_validator_1.IsArray)({ message: 'Daftar anggota tim harus berupa array.' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => TeamMemberDto),
    __metadata("design:type", Array)
], CreateTeamRegistrationDto.prototype, "members", void 0);
//# sourceMappingURL=create-team.dto.js.map