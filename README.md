# Sistem Pendaftaran Lomba (NestJS & Prisma Foundation)

Aplikasi backend modern untuk Sistem Pendaftaran Lomba (Maskumambang Fest), dibangun menggunakan **NestJS**, **TypeScript**, **Prisma ORM**, dan **PostgreSQL**.

---

## 1. Prerequisites

- **Node.js**: `v20.x` LTS atau `v22.x`
- **npm**: `v10.x` atau lebih baru
- **PostgreSQL**: `v15` atau `v16`

---

## 2. Quick Start & Setup

### A. Clone & Install Dependencies
```bash
cd node-app
npm install
```

### B. Environment Configuration
Salin file template `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Sesuaikan konfigurasi environment:
```env
NODE_ENV=development
PORT=3000
API_PREFIX=/api
DATABASE_URL="postgresql://username:password@localhost:5432/lomba_db?schema=public"
JWT_SECRET=generate_your_secure_64_char_random_hex_string
JWT_EXPIRATION=7d
QR_SECRET_SALT=generate_your_secure_64_char_salt
DATA_RESET_CODE=RESET124
UPLOAD_FOLDER=uploads
MAX_FILE_SIZE_BYTES=5242880
THROTTLE_TTL=60000
THROTTLE_LIMIT=60
```

### C. Database Migration & Prisma Client
Generate Prisma Client dan jalankan migrasi ke PostgreSQL:
```bash
# Generate Prisma Client
npm run prisma:generate

# Jalankan migrasi skema database
npm run prisma:migrate
```

---

## 3. Running the Application

```bash
# Mode development (auto-reload)
npm run start:dev

# Mode production build & run
npm run build
npm run start:prod
```

---

## 4. Verification & Testing

```bash
# Menjalankan unit tests
npm test

# Menjalankan E2E integration tests
npm run test:e2e

# Menjalankan linter code quality
npm run lint
```

---

## 5. Endpoints & API Structure (Phase 2 Foundation)

- **Health Check**: `GET /health` (Public, status database & service)
- **API Base Prefix**: `/api`
- **Auth Register**: `POST /api/auth/register` (Public)
- **Auth Login**: `POST /api/auth/login` (Public, Rate Limited)
- **User Profile**: `GET /api/users/profile` (Protected via JWT)
- **Admin User Status**: `PATCH /api/users/:id/toggle-status` (Protected via `SUPER_ADMIN` Role)
