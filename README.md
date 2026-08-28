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

## 🚀 Panduan Deploy ke VPS (Step by Step)

> Cocok untuk VPS Ubuntu/Debian dengan domain sendiri.

### Prasyarat — Install di VPS dulu

```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Install Node.js v20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2 (menjalankan app terus meskipun terminal ditutup)
sudo npm install -g pm2

# Install Nginx (web server / reverse proxy)
sudo apt install -y nginx

# Cek versi
node --version    # harus v20+
psql --version    # harus 14+
```

---

### Langkah 1 — Clone project dari GitHub

```bash
git clone https://github.com/aminrois/maskumambang-fest.git
cd maskumambang-fest
```

---

### Langkah 2 — Install dependencies

```bash
npm install
```

---

### Langkah 3 — Buat file konfigurasi (.env)

```bash
cp .env.example .env
nano .env
```

Isi bagian ini (wajib diganti):

```env
NODE_ENV=production
PORT=3000

# Ganti dengan info database Anda
DATABASE_URL="postgresql://lomba_user:PASSWORD_ANDA@localhost:5432/lomba_db?schema=public"

# Generate secret dengan perintah di bawah
JWT_SECRET=isi_dengan_string_random_64_karakter
QR_SECRET_SALT=isi_dengan_string_random_64_karakter_berbeda
```

**Generate secret otomatis (jalankan 2x, hasil berbeda):**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

### Langkah 4 — Setup database PostgreSQL

```bash
sudo -u postgres psql <<SQL
CREATE USER lomba_user WITH PASSWORD 'ganti_password_kuat_disini';
CREATE DATABASE lomba_db OWNER lomba_user;
GRANT ALL PRIVILEGES ON DATABASE lomba_db TO lomba_user;
SQL
```

> ⚠️ Ganti `ganti_password_kuat_disini` dengan password yang sama dengan yang ada di `.env` pada `DATABASE_URL`

---

### Langkah 5 — Jalankan migrasi database

```bash
npx prisma migrate deploy
```

---

### Langkah 6 — Buat akun Superadmin

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();
bcrypt.hash('password_admin_anda', 10).then(async hash => {
  await prisma.user.create({ data: {
    name: 'Super Admin',
    email: 'admin@domain-anda.com',
    phoneNumber: '08xxxxxxxxxx',
    passwordHash: hash,
    role: 'SUPER_ADMIN',
    isActive: true,
  }});
  console.log('Superadmin berhasil dibuat!');
  await prisma.\$disconnect();
});
"
```

> Ganti `password_admin_anda`, `admin@domain-anda.com`, dan `08xxxxxxxxxx` sesuai kebutuhan.

---

### Langkah 7 — Build & jalankan aplikasi

```bash
# Build TypeScript ke JavaScript
npm run build

# Jalankan dengan PM2 (tetap jalan meski terminal ditutup)
pm2 start dist/main.js --name maskumambang-fest

# Simpan agar otomatis start saat VPS reboot
pm2 save
pm2 startup
# (ikuti instruksi yang muncul)
```

---

### Langkah 8 — Setup Nginx sebagai reverse proxy

```bash
sudo nano /etc/nginx/sites-available/maskumambang
```

Isi dengan (ganti `domain-anda.com`):

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
# Aktifkan dan reload Nginx
sudo ln -s /etc/nginx/sites-available/maskumambang /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### Langkah 9 — Pasang SSL / HTTPS gratis (Certbot)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d domain-anda.com -d www.domain-anda.com
# Ikuti instruksi (masukkan email, setuju terms, pilih redirect HTTP -> HTTPS)
```

> ✅ SSL gratis dari Let's Encrypt, diperbarui otomatis setiap 90 hari.

---

### ✅ Selesai! Buka browser: `https://domain-anda.com`

---

## 🔧 Perintah Berguna Setelah Deploy

```bash
# Lihat log aplikasi
pm2 logs maskumambang-fest

# Restart aplikasi
pm2 restart maskumambang-fest

# Update dari GitHub
cd maskumambang-fest
git pull origin main
npm install
npm run build
pm2 restart maskumambang-fest

# Backup database
pg_dump -U lomba_user lomba_db > backup_$(date +%Y%m%d).sql

# Status semua proses
pm2 status
```

---

## 🛡️ Keamanan Production

- ✅ Ganti semua secret di `.env` dengan nilai random yang kuat
- ✅ Gunakan HTTPS (Certbot yang mengurus ini)
- ✅ Aktifkan firewall:
  ```bash
  sudo ufw allow 22
  sudo ufw allow 80
  sudo ufw allow 443
  sudo ufw deny 5432   # Blokir akses PostgreSQL dari luar
  sudo ufw enable
  ```
- ✅ File `.env` tidak ikut ke GitHub (sudah di `.gitignore`)

---

## 📝 Catatan Teknis

- **Node.js** berjalan di port 3000 (HTTP internal, tidak perlu SSL)
- **Nginx** yang mengurus HTTPS/SSL di port 443
- **HSTS** dan SSL ditangani oleh Certbot + Nginx — tidak perlu konfigurasi tambahan di aplikasi
- File upload tersimpan di folder `uploads/` (tidak ikut ke GitHub)

---

## 📞 Support

Sistem dikembangkan untuk **Maskumambang Fest** — Festival Lomba Kreativitas Pelajar.
