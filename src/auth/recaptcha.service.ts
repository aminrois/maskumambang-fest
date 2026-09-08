import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RecaptchaService {
  private readonly logger = new Logger(RecaptchaService.name);
  private readonly secretKey: string;
  private readonly isEnabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.secretKey =
      this.configService.get<string>('recaptcha.secretKey') ||
      '6LcNx7AtAAAAALe3Rn0nQn_o_Hxd4YQHmMwCINA-';
    this.isEnabled = this.configService.get<boolean>('recaptcha.enabled') ?? true;
  }

  /**
   * Memvalidasi response token Google reCAPTCHA v2 ke Google API.
   * @param token Token response dari widget reCAPTCHA frontend
   * @param remoteIp IP address client (opsional)
   */
  async verify(token?: string, remoteIp?: string): Promise<boolean> {
    if (!this.isEnabled) {
      return true;
    }

    if (!token || typeof token !== 'string' || token.trim() === '') {
      throw new BadRequestException('Silakan centang reCAPTCHA untuk membuktikan Anda bukan robot.');
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
        throw new BadRequestException('Gagal menghubungi server verifikasi reCAPTCHA.');
      }

      const data = (await response.json()) as {
        success: boolean;
        challenge_ts?: string;
        hostname?: string;
        'error-codes'?: string[];
      };

      if (!data.success) {
        this.logger.warn(`reCAPTCHA verification failed: ${JSON.stringify(data['error-codes'] || [])}`);
        throw new BadRequestException(
          'Verifikasi reCAPTCHA tidak valid atau kedaluwarsa. Silakan centang ulang.',
        );
      }

      return true;
    } catch (err: any) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      this.logger.error(`reCAPTCHA network/verification exception: ${err.message}`, err.stack);
      throw new BadRequestException(
        'Terjadi kesalahan saat memverifikasi reCAPTCHA. Silakan coba kembali.',
      );
    }
  }
}
