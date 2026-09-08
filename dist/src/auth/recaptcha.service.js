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
var RecaptchaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecaptchaService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let RecaptchaService = RecaptchaService_1 = class RecaptchaService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(RecaptchaService_1.name);
        this.secretKey =
            this.configService.get('recaptcha.secretKey') ||
                '6LcNx7AtAAAAALe3Rn0nQn_o_Hxd4YQHmMwCINA-';
        this.isEnabled = this.configService.get('recaptcha.enabled') ?? true;
    }
    async verify(token, remoteIp) {
        if (!this.isEnabled) {
            return true;
        }
        if (!token || typeof token !== 'string' || token.trim() === '') {
            throw new common_1.BadRequestException('Silakan centang reCAPTCHA untuk membuktikan Anda bukan robot.');
        }
        try {
            const verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
            const bodyParams = new URLSearchParams({
                secret: this.secretKey,
                response: token.trim(),
            });
            if (remoteIp) {
                bodyParams.append('remoteip', remoteIp);
            }
            const response = await fetch(verifyUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: bodyParams.toString(),
            });
            if (!response.ok) {
                this.logger.error(`Google reCAPTCHA HTTP error status: ${response.status}`);
                throw new common_1.BadRequestException('Gagal menghubungi server verifikasi reCAPTCHA.');
            }
            const data = (await response.json());
            if (!data.success) {
                this.logger.warn(`reCAPTCHA verification failed: ${JSON.stringify(data['error-codes'] || [])}`);
                throw new common_1.BadRequestException('Verifikasi reCAPTCHA tidak valid atau kedaluwarsa. Silakan centang ulang.');
            }
            return true;
        }
        catch (err) {
            if (err instanceof common_1.BadRequestException) {
                throw err;
            }
            this.logger.error(`reCAPTCHA network/verification exception: ${err.message}`, err.stack);
            throw new common_1.BadRequestException('Terjadi kesalahan saat memverifikasi reCAPTCHA. Silakan coba kembali.');
        }
    }
};
exports.RecaptchaService = RecaptchaService;
exports.RecaptchaService = RecaptchaService = RecaptchaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RecaptchaService);
//# sourceMappingURL=recaptcha.service.js.map