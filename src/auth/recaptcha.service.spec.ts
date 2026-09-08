import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { RecaptchaService } from './recaptcha.service';

describe('RecaptchaService', () => {
  let service: RecaptchaService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'recaptcha.secretKey') return 'test_secret_key';
      if (key === 'recaptcha.enabled') return true;
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecaptchaService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<RecaptchaService>(RecaptchaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw BadRequestException if token is missing when enabled', async () => {
    await expect(service.verify('')).rejects.toThrow(BadRequestException);
    await expect(service.verify(undefined)).rejects.toThrow(BadRequestException);
  });

  it('should return true if enabled is false', async () => {
    const disabledConfig = {
      get: jest.fn((key: string) => {
        if (key === 'recaptcha.enabled') return false;
        return null;
      }),
    };
    const disabledModule: TestingModule = await Test.createTestingModule({
      providers: [
        RecaptchaService,
        { provide: ConfigService, useValue: disabledConfig },
      ],
    }).compile();
    const disabledService = disabledModule.get<RecaptchaService>(RecaptchaService);

    const result = await disabledService.verify(undefined);
    expect(result).toBe(true);
  });

  it('should return true when Google verification succeeds', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true }),
    } as any);

    const result = await service.verify('valid_token_123', '127.0.0.1');
    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://www.google.com/recaptcha/api/siteverify',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  it('should throw BadRequestException when Google verification returns false', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        success: false,
        'error-codes': ['invalid-input-response'],
      }),
    } as any);

    await expect(service.verify('invalid_token', '127.0.0.1')).rejects.toThrow(BadRequestException);
  });
});
