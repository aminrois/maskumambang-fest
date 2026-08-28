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
exports.CompetitionsController = void 0;
const common_1 = require("@nestjs/common");
const competitions_service_1 = require("./competitions.service");
const public_decorator_1 = require("../common/decorators/public.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const competition_dto_1 = require("./dto/competition.dto");
let CompetitionsController = class CompetitionsController {
    constructor(competitionsService) {
        this.competitionsService = competitionsService;
    }
    async getCompetitionTree() {
        const tree = await this.competitionsService.getTree();
        return {
            success: true,
            data: tree,
        };
    }
    async getBranchDetail(id) {
        const branch = await this.competitionsService.getBranchDetail(id);
        return {
            success: true,
            data: branch,
        };
    }
    async getAllCategories() {
        const categories = await this.competitionsService.getAllCategories();
        return { success: true, data: categories };
    }
    async createCategory(dto) {
        const created = await this.competitionsService.createCategory(dto);
        return { success: true, message: 'Kategori berhasil dibuat.', data: created };
    }
    async updateCategory(id, dto) {
        const updated = await this.competitionsService.updateCategory(id, dto);
        return { success: true, message: 'Kategori berhasil diperbarui.', data: updated };
    }
    async toggleCategory(id) {
        const toggled = await this.competitionsService.toggleCategory(id);
        return {
            success: true,
            message: `Status kategori diubah menjadi: ${toggled.isActive ? 'AKTIF' : 'NONAKTIF'}`,
            data: toggled,
        };
    }
    async getLevelsByCategory(categoryId) {
        const levels = await this.competitionsService.getLevelsByCategory(categoryId);
        return { success: true, data: levels };
    }
    async createLevel(dto) {
        const created = await this.competitionsService.createLevel(dto);
        return { success: true, message: 'Jenjang berhasil dibuat.', data: created };
    }
    async updateLevel(id, dto) {
        const updated = await this.competitionsService.updateLevel(id, dto);
        return { success: true, message: 'Jenjang berhasil diperbarui.', data: updated };
    }
    async getBranchesByLevel(levelId) {
        const branches = await this.competitionsService.getBranchesByLevel(levelId);
        return { success: true, data: branches };
    }
    async createBranch(dto) {
        const created = await this.competitionsService.createBranch(dto);
        return { success: true, message: 'Cabang lomba berhasil dibuat.', data: created };
    }
    async getAllLevels() {
        const levels = await this.competitionsService.getAllLevels();
        return { success: true, data: levels };
    }
    async getAllBranches() {
        const branches = await this.competitionsService.getAllBranches();
        return { success: true, data: branches };
    }
    async deleteCategory(id) {
        const deleted = await this.competitionsService.deleteCategory(id);
        return { success: true, message: 'Kategori berhasil dihapus.', data: deleted };
    }
    async deleteLevel(id) {
        const deleted = await this.competitionsService.deleteLevel(id);
        return { success: true, message: 'Jenjang berhasil dihapus.', data: deleted };
    }
    async updateBranch(id, dto) {
        const updated = await this.competitionsService.updateBranch(id, dto);
        return { success: true, message: 'Cabang lomba berhasil diperbarui.', data: updated };
    }
    async deleteBranch(id) {
        const deleted = await this.competitionsService.deleteBranch(id);
        return { success: true, message: 'Cabang lomba berhasil dihapus.', data: deleted };
    }
    async toggleBranch(id) {
        const toggled = await this.competitionsService.toggleBranch(id);
        return {
            success: true,
            message: `Status cabang lomba diubah menjadi: ${toggled.isActive ? 'AKTIF' : 'NONAKTIF'}`,
            data: toggled,
        };
    }
};
exports.CompetitionsController = CompetitionsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('tree'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CompetitionsController.prototype, "getCompetitionTree", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('branch/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompetitionsController.prototype, "getBranchDetail", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN),
    (0, common_1.Get)('categories'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CompetitionsController.prototype, "getAllCategories", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)('categories'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [competition_dto_1.CreateCategoryDto]),
    __metadata("design:returntype", Promise)
], CompetitionsController.prototype, "createCategory", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN),
    (0, common_1.Patch)('categories/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, competition_dto_1.UpdateCategoryDto]),
    __metadata("design:returntype", Promise)
], CompetitionsController.prototype, "updateCategory", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN),
    (0, common_1.Patch)('categories/:id/toggle'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompetitionsController.prototype, "toggleCategory", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN),
    (0, common_1.Get)('categories/:categoryId/levels'),
    __param(0, (0, common_1.Param)('categoryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompetitionsController.prototype, "getLevelsByCategory", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)('levels'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [competition_dto_1.CreateLevelDto]),
    __metadata("design:returntype", Promise)
], CompetitionsController.prototype, "createLevel", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN),
    (0, common_1.Patch)('levels/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, competition_dto_1.UpdateLevelDto]),
    __metadata("design:returntype", Promise)
], CompetitionsController.prototype, "updateLevel", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN),
    (0, common_1.Get)('levels/:levelId/branches'),
    __param(0, (0, common_1.Param)('levelId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompetitionsController.prototype, "getBranchesByLevel", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)('branches'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [competition_dto_1.CreateBranchDto]),
    __metadata("design:returntype", Promise)
], CompetitionsController.prototype, "createBranch", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN),
    (0, common_1.Get)('levels/all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CompetitionsController.prototype, "getAllLevels", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN),
    (0, common_1.Get)('branches/all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CompetitionsController.prototype, "getAllBranches", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN),
    (0, common_1.Delete)('categories/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompetitionsController.prototype, "deleteCategory", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN),
    (0, common_1.Delete)('levels/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompetitionsController.prototype, "deleteLevel", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN),
    (0, common_1.Patch)('branches/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, competition_dto_1.UpdateBranchDto]),
    __metadata("design:returntype", Promise)
], CompetitionsController.prototype, "updateBranch", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN),
    (0, common_1.Delete)('branches/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompetitionsController.prototype, "deleteBranch", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN),
    (0, common_1.Patch)('branches/:id/toggle'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompetitionsController.prototype, "toggleBranch", null);
exports.CompetitionsController = CompetitionsController = __decorate([
    (0, common_1.Controller)('competitions'),
    __metadata("design:paramtypes", [competitions_service_1.CompetitionsService])
], CompetitionsController);
//# sourceMappingURL=competitions.controller.js.map