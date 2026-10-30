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
exports.BulkDeleteRegistrationDto = void 0;
const class_validator_1 = require("class-validator");
class BulkDeleteRegistrationDto {
}
exports.BulkDeleteRegistrationDto = BulkDeleteRegistrationDto;
__decorate([
    (0, class_validator_1.IsArray)({ message: 'Daftar ID pendaftaran harus berupa array.' }),
    (0, class_validator_1.ArrayMinSize)(1, { message: 'Pilih setidaknya satu pendaftaran untuk dihapus.' }),
    __metadata("design:type", Array)
], BulkDeleteRegistrationDto.prototype, "registrationIds", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'PIN konfirmasi wajib berupa teks.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'PIN konfirmasi wajib diisi.' }),
    __metadata("design:type", String)
], BulkDeleteRegistrationDto.prototype, "pin", void 0);
//# sourceMappingURL=bulk-delete.dto.js.map