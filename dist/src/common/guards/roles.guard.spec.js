"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const roles_guard_1 = require("./roles.guard");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
describe('RolesGuard', () => {
    let guard;
    let reflector;
    beforeEach(() => {
        reflector = new core_1.Reflector();
        guard = new roles_guard_1.RolesGuard(reflector);
    });
    it('should allow access if no roles are required', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
        const context = {
            getHandler: () => { },
            getClass: () => { },
            switchToHttp: () => ({
                getRequest: () => ({ user: null }),
            }),
        };
        expect(guard.canActivate(context)).toBe(true);
    });
    it('should allow access if user has the required role', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([client_1.Role.SUPER_ADMIN]);
        const context = {
            getHandler: () => { },
            getClass: () => { },
            switchToHttp: () => ({
                getRequest: () => ({ user: { role: client_1.Role.SUPER_ADMIN } }),
            }),
        };
        expect(guard.canActivate(context)).toBe(true);
    });
    it('should throw ForbiddenException if user does not have the required role', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([client_1.Role.SUPER_ADMIN]);
        const context = {
            getHandler: () => { },
            getClass: () => { },
            switchToHttp: () => ({
                getRequest: () => ({ user: { role: client_1.Role.PESERTA } }),
            }),
        };
        expect(() => guard.canActivate(context)).toThrow(common_1.ForbiddenException);
    });
});
//# sourceMappingURL=roles.guard.spec.js.map