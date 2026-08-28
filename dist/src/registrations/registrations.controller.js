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
exports.RegistrationsController = void 0;
const common_1 = require("@nestjs/common");
const registrations_service_1 = require("./registrations.service");
const create_individual_dto_1 = require("./dto/create-individual.dto");
const create_team_dto_1 = require("./dto/create-team.dto");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let RegistrationsController = class RegistrationsController {
    constructor(registrationsService) {
        this.registrationsService = registrationsService;
    }
    async createIndividual(userId, dto) {
        const data = await this.registrationsService.createIndividual(userId, dto);
        return {
            success: true,
            message: 'Pendaftaran individu berhasil dibuat!',
            data,
        };
    }
    async createTeam(userId, dto) {
        const data = await this.registrationsService.createTeam(userId, dto);
        return {
            success: true,
            message: 'Pendaftaran tim/beregu berhasil dibuat!',
            data,
        };
    }
    async listAll(search, status, branchId, page = '1', perPage = '25') {
        const data = await this.registrationsService.listAllRegistrations(search, status, branchId, parseInt(page, 10) || 1, parseInt(perPage, 10) || 25);
        return { success: true, ...data };
    }
    async getMyRegistrations(userId) {
        const data = await this.registrationsService.getUserRegistrations(userId);
        return {
            success: true,
            data,
        };
    }
    async getRegistrationDetail(id, userId, role) {
        const data = await this.registrationsService.getRegistrationById(id, userId, role);
        return {
            success: true,
            data,
        };
    }
};
exports.RegistrationsController = RegistrationsController;
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.PESERTA),
    (0, common_1.Post)('individual'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_individual_dto_1.CreateIndividualRegistrationDto]),
    __metadata("design:returntype", Promise)
], RegistrationsController.prototype, "createIndividual", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.PESERTA),
    (0, common_1.Post)('team'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_team_dto_1.CreateTeamRegistrationDto]),
    __metadata("design:returntype", Promise)
], RegistrationsController.prototype, "createTeam", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.BENDAHARA, client_1.Role.SUPER_ADMIN),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('branchId')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('perPage')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], RegistrationsController.prototype, "listAll", null);
__decorate([
    (0, common_1.Get)('my'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RegistrationsController.prototype, "getMyRegistrations", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], RegistrationsController.prototype, "getRegistrationDetail", null);
exports.RegistrationsController = RegistrationsController = __decorate([
    (0, common_1.Controller)('registrations'),
    __metadata("design:paramtypes", [registrations_service_1.RegistrationsService])
], RegistrationsController);
//# sourceMappingURL=registrations.controller.js.map