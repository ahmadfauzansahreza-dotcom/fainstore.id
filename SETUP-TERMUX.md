# FAIN STORE — versi perbaikan

## 1. Install dependency
```bash
cd ~/fain-store
npm install
```

## 2. Environment
Buat `.env.local` dari `.env.local.example`, lalu isi nilai environment milik kamu.
Jangan upload `.env.local` ke publik.

Minimal untuk database + auth + pembayaran:
- DATABASE_URL
- NEXTAUTH_SECRET
- NEXTAUTH_URL
- MIDTRANS_SERVER_KEY
- NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
- MIDTRANS_IS_PRODUCTION

## 3. Generate Prisma
```bash
npx prisma generate
```

Jika database belum dibuat/migrasi:
```bash
npx prisma migrate dev
```

## 4. Build
```bash
npm run build
```

## 5. Jalankan
```bash
npm run dev
```

## Catatan
Project ini sudah dibersihkan agar hanya memakai arsitektur `src/app`.
Folder `app/`, `lib/`, dan project duplikat lama yang sebelumnya bercampur dengan project aktif tidak lagi dipakai.
