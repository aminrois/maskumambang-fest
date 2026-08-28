# 🏆 Maskumambang Fest — Sistem Pendaftaran Lomba

Sistem pendaftaran lomba berbasis web full-stack menggunakan **NestJS** (backend) + **Vanilla JS** (frontend) + **PostgreSQL** (database).

---

## 🗂️ Fitur Utama

- **Multi-role**: Super Admin, Bendahara, Admin Barcode, Peserta
- **Pendaftaran online** perorangan & beregu
- **Verifikasi pembayaran** dengan bukti transfer
- **Kartu peserta digital** dengan QR Code unik (10cm × 14cm)
- **Check-in QR** via kamera (scanner barcode)
- **Cetak massal** kartu peserta (PDF)
- **Dashboard** per role dengan statistik real-time
- **Audit log** setiap aksi admin

---

## 🚀 Cara Deploy ke VPS/Server

### Prasyarat

```bash
# Node.js v18+ 
node --version

# PostgreSQL 14+
psql --version

# PM2 (process manager)
npm install -g pm2
```

### 1. Clone repository

```bash
git clone https://github.com/aminrois/maskumambang-fest.git
cd maskumambang-fest
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment

```bash
cp .env.example .env
nano .env   # Edit sesuai konfigurasi server Anda
```

Wajib diisi:
- `DATABASE_URL` — koneksi PostgreSQL
- `JWT_SECRET` — minimal 64 karakter random
- `QR_SECRET_SALT` — minimal 64 karakter random

Generate secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Setup database PostgreSQL

```bash
# Buat user dan database PostgreSQL
sudo -u postgres psql << SQL
CREATE USER lomba_user WITH PASSWORD 'password_kuat_anda';
CREATE DATABASE lomba_db OWNER lomba_user;
GRANT ALL PRIVILEGES ON DATABASE lomba_db TO lomba_user;
SQL
```

### 5. Jalankan migrasi database

```bash
npx prisma migrate deploy
```

### 6. Buat akun Superadmin pertama

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();
bcrypt.hash('password_anda', 10).then(async hash => {
  await prisma.user.create({ data: {
    name: 'Super Admin',
    email: 'admin@email.anda',
    phoneNumber: '08xxxxxxxxxx',
    passwordHash: hash,
    role: 'SUPER_ADMIN',
    isActive: true,
  }});
  console.log('Superadmin dibuat!');
  await prisma.\$disconnect();
});
"
```

### 7. Build & jalankan aplikasi

```bash
# Build TypeScript
npm run build

# Jalankan dengan PM2
pm2 start dist/main.js --name maskumambang-fest

# Simpan config PM2 (auto-start saat reboot)
pm2 save
pm2 startup
```

### 8. Setup Nginx (reverse proxy)

```nginx
server {
    listen 80;
    server_name domain-anda.com www.domain-anda.com;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Aktifkan site
sudo ln -s /etc/nginx/sites-available/maskumambang /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 9. SSL dengan Certbot (HTTPS)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d domain-anda.com
```

---

## 🔧 Perintah Berguna

```bash
# Lihat log aplikasi
pm2 logs maskumambang-fest

# Restart aplikasi
pm2 restart maskumambang-fest

# Prisma Studio (admin DB)
npx prisma studio

# Backup database
pg_dump -U lomba_user lomba_db > backup_$(date +%Y%m%d).sql
```

---

## 📁 Struktur Project

```
maskumambang-fest/
├── src/                    # Source TypeScript (NestJS)
│   ├── auth/               # Autentikasi & JWT
│   ├── users/              # Manajemen user
│   ├── competitions/       # Kategori & cabang lomba
│   ├── registrations/      # Pendaftaran peserta
│   ├── payments/           # Verifikasi pembayaran
│   ├── cards/              # Kartu peserta & QR
│   ├── checkin/            # Scan QR check-in
│   └── settings/           # Pengaturan aplikasi
├── public/                 # Frontend (HTML/CSS/JS)
│   ├── index.html
│   ├── css/
│   └── js/app.js
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/        # Migrasi database
├── uploads/                # File upload (gitignored)
├── .env.example            # Template environment
└── package.json
```

---

## 🛡️ Keamanan Production

- Ganti semua secret di `.env` dengan nilai random yang kuat
- Gunakan HTTPS (Certbot/SSL)
- Batasi akses port PostgreSQL (hanya localhost)
- Aktifkan firewall: `ufw allow 80,443/tcp`

---

## 📞 Support

Sistem dikembangkan untuk **Maskumambang Fest** — Festival Lomba Kreativitas Pelajar.
