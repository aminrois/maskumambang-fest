"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const helmet_1 = require("helmet");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const path = require("path");
const fs = require("fs");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const nodeEnv = configService.get('NODE_ENV') || 'development';
    const isProduction = nodeEnv === 'production';
    app.use(compression());
    app.use((0, helmet_1.default)({
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
                upgradeInsecureRequests: null,
            },
        },
        crossOriginEmbedderPolicy: false,
    }));
    app.use(cookieParser());
    app.enableCors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRFToken', 'X-Requested-With'],
    });
    const publicDir = path.resolve(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }
    app.useStaticAssets(publicDir, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        etag: true,
        lastModified: true,
        setHeaders: (res, filePath) => {
            if (filePath.endsWith('.html')) {
                res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
            }
            else {
                res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
            }
        },
    });
    const apiPrefix = configService.get('apiPrefix') || '/api';
    app.setGlobalPrefix(apiPrefix.replace(/^\//, ''), {
        exclude: ['health'],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    const port = configService.get('port') || 3000;
    await app.listen(port);
    logger.log(`🚀 NestJS Server running at http://localhost:${port}/${apiPrefix.replace(/^\//, '')}`);
    logger.log(`🩺 Health check endpoint: http://localhost:${port}/health`);
    logger.log(`🌐 Web UI available at: http://localhost:${port}/`);
}
bootstrap();
//# sourceMappingURL=main.js.map