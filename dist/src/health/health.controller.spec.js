"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const health_controller_1 = require("./health.controller");
const prisma_service_1 = require("../prisma/prisma.service");
describe('HealthController', () => {
    let controller;
    let prismaService;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [health_controller_1.HealthController],
            providers: [
                {
                    provide: prisma_service_1.PrismaService,
                    useValue: {
                        isHealthy: jest.fn().mockResolvedValue(true),
                    },
                },
            ],
        }).compile();
        controller = module.get(health_controller_1.HealthController);
        prismaService = module.get(prisma_service_1.PrismaService);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
    it('should return health status without exposing sensitive credentials', async () => {
        const res = await controller.getHealth();
        expect(res).toBeDefined();
        expect(res.status).toBe('ok');
        expect(res.database).toBe('connected');
        expect(res).not.toHaveProperty('databaseUrl');
        expect(res).not.toHaveProperty('password');
        expect(res).not.toHaveProperty('secret');
    });
});
//# sourceMappingURL=health.controller.spec.js.map