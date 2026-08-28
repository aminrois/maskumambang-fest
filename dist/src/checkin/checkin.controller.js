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
exports.CheckInController = void 0;
const common_1 = require("@nestjs/common");
const checkin_service_1 = require("./checkin.service");
const checkin_dto_1 = require("./dto/checkin.dto");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let CheckInController = class CheckInController {
    constructor(checkInService) {
        this.checkInService = checkInService;
    }
    async scanCheckIn(staffId, dto) {
        return await this.checkInService.processCheckIn(staffId, dto);
    }
    async scanCheckIn2(staffId, dto) {
        return await this.checkInService.processCheckIn2(staffId, dto);
    }
    async getLiveLog(limit = '100') {
        const logs = await this.checkInService.getLiveCheckInLogs(parseInt(limit, 10) || 100);
        return {
            success: true,
            count: logs.length,
            data: logs,
        };
    }
};
exports.CheckInController = CheckInController;
__decorate([
    (0, common_1.Post)('scan'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, checkin_dto_1.ScanCheckInDto]),
    __metadata("design:returntype", Promise)
], CheckInController.prototype, "scanCheckIn", null);
__decorate([
    (0, common_1.Post)('scan2'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, checkin_dto_1.ScanCheckInDto]),
    __metadata("design:returntype", Promise)
], CheckInController.prototype, "scanCheckIn2", null);
__decorate([
    (0, common_1.Get)('live-log'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CheckInController.prototype, "getLiveLog", null);
exports.CheckInController = CheckInController = __decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.BENDAHARA, client_1.Role.SUPER_ADMIN, client_1.Role.ADMIN_BARCODE),
    (0, common_1.Controller)('checkin'),
    __metadata("design:paramtypes", [checkin_service_1.CheckInService])
], CheckInController);
//# sourceMappingURL=checkin.controller.js.map