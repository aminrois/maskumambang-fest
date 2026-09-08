import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { RecaptchaService } from './recaptcha.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret') || 'dev_jwt_secret_fallback_key',
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn') || '7d',
        },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy, RecaptchaService],
  controllers: [AuthController],
  exports: [AuthService, RecaptchaService, PassportModule, JwtModule],
})
export class AuthModule {}
