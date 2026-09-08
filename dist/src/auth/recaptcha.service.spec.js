"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
const recaptcha_service_1 = require("./recaptcha.service");
describe('RecaptchaService', () => {
    let service;
    let configService;
    const mockConfigService = {
        get: jest.fn((key) => {
            if (key === 'recaptcha.secretKey')
                return 'test_secret_key';
            if (key === 'recaptcha.enabled')
                return true;
            return null;
        }),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                recaptcha_service_1.RecaptchaService,
                { provide: config_1.ConfigService, useValue: mockConfigService },
            ],
        }).compile();
        service = module.get(recaptcha_service_1.RecaptchaService);
        configService = module.get(config_1.ConfigService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    it('should throw BadRequestException if token is missing when enabled', async () => {
        await expect(service.verify('')).rejects.toThrow(common_1.BadRequestException);
        await expect(service.verify(undefined)).rejects.toThrow(common_1.BadRequestException);
    });
    it('should return true if enabled is false', async () => {
        const disabledConfig = {
            get: jest.fn((key) => {
                if (key === 'recaptcha.enabled')
                    return false;
                return null;
            }),
        };
        const disabledModule = await testing_1.Test.createTestingModule({
            providers: [
                recaptcha_service_1.RecaptchaService,
                { provide: config_1.ConfigService, useValue: disabledConfig },
            ],
        }).compile();
        const disabledService = disabledModule.get(recaptcha_service_1.RecaptchaService);
        const result = await disabledService.verify(undefined);
        expect(result).toBe(true);
    });
    it('should return true when Google verification succeeds', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({ success: true }),
        });
        const result = await service.verify('valid_token_123', '127.0.0.1');
        expect(result).toBe(true);
        expect(global.fetch).toHaveBeenCalledWith('https://www.google.com/recaptcha/api/siteverify', expect.objectContaining({
            method: 'POST',
        }));
    });
    it('should throw BadRequestException when Google verification returns false', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({
                success: false,
                'error-codes': ['invalid-input-response'],
            }),
        });
        await expect(service.verify('invalid_token', '127.0.0.1')).rejects.toThrow(common_1.BadRequestException);
    });
});
//# sourceMappingURL=recaptcha.service.spec.js.map