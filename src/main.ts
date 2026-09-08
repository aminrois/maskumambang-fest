import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import * as compression from 'compression';
import * as path from 'path';
import * as fs from 'fs';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  const nodeEnv = configService.get<string>('NODE_ENV') || 'development';
  const isProduction = nodeEnv === 'production';

  // Gzip Compression
  app.use(compression());

  // Security Headers via Helmet
  // NOTE: HSTS is DISABLED on HTTP (development). Enable only on HTTPS production.
  // Enabling HSTS on HTTP causes Safari to cache the directive and force HTTPS
  // for all subsequent requests, breaking navigation on non-SSL servers.
  app.use(
    helmet({
      // Disable HSTS completely on HTTP - Safari caches this and breaks all links
      hsts: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://cdnjs.cloudflare.com',
            'https://unpkg.com',
            'https://cdn.jsdelivr.net',
            'https://www.google.com',
            'https://www.gstatic.com',
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
          imgSrc: ["'self'", 'data:', 'blob:', 'https://www.google.com', 'https://www.gstatic.com'],
          connectSrc: ["'self'", 'https://www.google.com', 'https://www.gstatic.com'],
          frameSrc: ["'self'", 'https://www.google.com', 'https://recaptcha.google.com'],
          mediaSrc: ["'self'", 'blob:'],
          // Do NOT upgrade insecure requests on HTTP servers - breaks Safari navigation
          upgradeInsecureRequests: null,
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

  // Serve static frontend assets from public/ directory with 7-day browser caching
  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  app.useStaticAssets(publicDir, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari (604800000 ms)
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      // Untuk file HTML, jangan di-cache lama agar pembaruan UI langsung termutakhirkan
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      }
    },
  });

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
