import { ConfigService } from '@nestjs/config';
export declare class RecaptchaService {
    private readonly configService;
    private readonly logger;
    private readonly secretKey;
    private readonly isEnabled;
    constructor(configService: ConfigService);
    verify(token?: string, remoteIp?: string): Promise<boolean>;
}
