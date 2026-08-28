import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import * as path from 'path';
import * as fs from 'fs';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Security Headers via Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://cdnjs.cloudflare.com',
            'https://unpkg.com',
            'https://cdn.jsdelivr.net',
          ],
          scriptSrcAttr: ["'unsafe-inline'"],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://fonts.googleapis.com',
            'https://cdnjs.cloudflare.com',
            'https://cdn.jsdelivr.net',
          ],
          fontSrc: [
            "'self'",
            'https://fonts.gstatic.com',
            'https://cdnjs.cloudflare.com',
          ],
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Cookie Parser
  app.use(cookieParser());

  // CORS Configuration
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRFToken', 'X-Requested-With'],
  });

  // Serve static frontend assets from public/ directory
  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  app.useStaticAssets(publicDir);

  // Global Prefix: /api (excluding /health)
  const apiPrefix = configService.get<string>('apiPrefix') || '/api';
  app.setGlobalPrefix(apiPrefix.replace(/^\//, ''), {
    exclude: ['health'],
  });

  // Global Validation Pipe (Strict DTO validation, rejecting extra unknown fields)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global Exception Filter (Production error sanitization)
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = configService.get<number>('port') || 3000;
  await app.listen(port);
  logger.log(`🚀 NestJS Server running at http://localhost:${port}/${apiPrefix.replace(/^\//, '')}`);
  logger.log(`🩺 Health check endpoint: http://localhost:${port}/health`);
  logger.log(`🌐 Web UI available at: http://localhost:${port}/`);
}

bootstrap();
