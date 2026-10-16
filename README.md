# FAIN STORE

Marketplace akun game (Free Fire, Mobile Legends) & top up game online.

⚠️ **Catatan keamanan penting**: jika Anda pernah menyimpan kredensial Midtrans/Cloudinary/WhatsApp/SMTP
yang asli di dalam prompt, dokumen, atau riwayat chat mana pun, anggap kredensial tersebut **bocor**.
Rotate/regenerate semuanya sebelum melanjutkan setup di bawah ini.

## Requirements
- Node.js 20+
- PostgreSQL 15+
- Akun Midtrans (mode Sandbox untuk development)
- Akun Cloudinary

## Instalasi

```bash
npm install
cp .env.example .env
# isi .env dengan kredensial ASLI dan BARU milik Anda
```

## Setup Database

```bash
npx prisma migrate dev --name init
npx prisma generate
```

## Membuat Admin Pertama

Jalankan script seed atau update langsung role user menjadi `SUPER_ADMIN` di database setelah user tersebut mendaftar.

## Development

```bash
npm run dev
```

## Konfigurasi Midtrans

1. Daftar di https://midtrans.com dan ambil **Sandbox** Server Key & Client Key.
2. Isi `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `MIDTRANS_MERCHANT_ID` di `.env`.
3. Pastikan `MIDTRANS_IS_PRODUCTION=false` selama pengujian.
4. Di dashboard Midtrans, set URL notifikasi (webhook) ke:
   `https://<domain-anda>/api/payments/midtrans/webhook`
5. Uji seluruh skenario di bagian "Midtrans Testing" pada dokumen perencanaan proyek (pembayaran sukses, pending, expired, dibatalkan, gagal, webhook duplikat, signature tidak valid, jumlah salah, order tidak dikenal, order yang sudah dibayar, produk habis stok).
6. Baru aktifkan `MIDTRANS_IS_PRODUCTION=true` dengan Server/Client Key **production** setelah semua skenario lulus.

## Konfigurasi Cloudinary

Isi `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` di `.env`.

## Konfigurasi Notifikasi Email (SMTP)

Isi `EMAIL_SERVER`, `EMAIL_USERNAME`, `EMAIL_PASSWORD` (dan `EMAIL_PORT` jika bukan 587) dengan kredensial SMTP Anda sendiri (mis. App Password Gmail yang baru, bukan yang lama). Notifikasi terkirim otomatis saat: order dibuat, pembayaran sukses, dan order dibatalkan/kedaluwarsa. Kegagalan kirim email tidak akan menggagalkan proses order/pembayaran.

## Membuat Admin Pertama (detail)

```bash
npx prisma studio
# buka tabel User, buat user baru dengan password ter-hash bcrypt,
# atau daftar biasa lalu update kolom role menjadi SUPER_ADMIN
```

## Production Build

```bash
npm run build
npm start
```

## Deployment ke Vercel

1. Hubungkan repository ke Vercel.
2. Set semua environment variable dari `.env.example` di Vercel Project Settings (jangan commit `.env`).
3. Tambahkan PostgreSQL (mis. Vercel Postgres/Neon/Supabase) dan set `DATABASE_URL`.
4. Arahkan domain `fainstore.com` ke Vercel lewat DNS (CNAME/A record sesuai instruksi Vercel) — domain tidak otomatis terhubung, ini harus dikonfigurasi manual di registrar Anda.
5. Update `MIDTRANS_...` ke kredensial production dan URL webhook Midtrans ke domain production.

## Catatan Keamanan

- Semua variabel di atas server-only — jangan pernah memberi prefix `NEXT_PUBLIC_` pada key rahasia (Server Key Midtrans, secret Cloudinary, password SMTP, dll).
- Kredensial akun game (`GameAccount.usernameEmailEnc` / `passwordEnc`) dienkripsi di application layer sebelum disimpan — set `ACCOUNT_CREDENTIALS_ENCRYPTION_KEY`.
- `.env` sudah masuk `.gitignore` — jangan pernah commit.

## Troubleshooting

- **Webhook tidak diterima**: pastikan URL webhook dapat diakses publik (tidak di localhost) — gunakan tunnel (mis. ngrok) saat development.
- **Signature tidak valid**: pastikan `MIDTRANS_SERVER_KEY` di `.env` sama persis dengan yang terdaftar di dashboard Midtrans untuk mode (sandbox/production) yang aktif.
