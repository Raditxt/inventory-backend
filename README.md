# Inventory Backend

Backend sistem inventory, penjualan, dan dashboard untuk demo portfolio (studi kasus: distributor sembako).
Dibangun dengan Next.js (API routes), Prisma 7, dan PostgreSQL.

Dokumentasi API: [docs/API.md](docs/API.md)

## Fitur

- Login JWT dengan dua role: `OWNER` dan `MANAGER`, dengan pembatasan percobaan login
- Product dengan alur persetujuan (product dari manager menunggu approval owner)
- Barang masuk dengan HPP rata-rata tertimbang (weighted average)
- Penjualan: dibuat `PENDING`, dikonfirmasi menjadi `SUCCESS`, atau dibatalkan (`CANCELLED`) dengan alasan; HPP dikunci saat konfirmasi
- Barang rusak dan koreksi stok dengan persetujuan owner
- Riwayat setiap perubahan stok (audit trail)
- Dashboard owner: omzet, HPP, laba kotor, nilai persediaan, stok rendah, kerugian barang rusak, tren penjualan harian

## Aturan bisnis utama

- Stok tidak boleh minus. Semua perubahan stok terjadi dalam satu transaksi database dan dikunci per baris, jadi dua request bersamaan tidak bisa saling menimpa.
- Penjualan yang sudah `SUCCESS` tidak bisa dihapus, hanya dibatalkan dengan alasan (stok dikembalikan).
- Harga jual dikunci saat penjualan dibuat, HPP dikunci saat dikonfirmasi.
- Barang rusak dan koreksi dari manager baru mengubah stok setelah disetujui owner.
- Laporan memakai zona waktu Asia/Jakarta (WIB).

## Prasyarat

- Node.js (versi LTS terbaru)
- Docker (untuk PostgreSQL lokal)

## Cara menjalankan

1. Salin file environment dan isi nilainya:

   ```bash
   cp .env.example .env
   ```

   (di PowerShell: `Copy-Item .env.example .env`)

   ```
   DATABASE_URL="postgresql://postgres:rahasia123@localhost:5433/inventory"
   JWT_SECRET="isi-dengan-string-acak-minimal-32-karakter"
   CORS_ORIGIN="*"
   ```

   `JWT_SECRET` harus minimal 32 karakter. Cara membuatnya: `node -p "require('crypto').randomBytes(32).toString('hex')"`

2. Jalankan PostgreSQL lewat Docker (sesuaikan port dengan `DATABASE_URL`):

   ```bash
   docker run --name inventory-db -e POSTGRES_PASSWORD=rahasia123 -e POSTGRES_DB=inventory -p 5433:5432 -d postgres:16
   ```

3. Install dependency, buat tabel, dan isi akun awal:

   ```bash
   npm install
   npx prisma migrate deploy
   npx tsx prisma/seed.js
   ```

4. (Opsional) Isi data contoh distributor sembako, lalu jalankan server:

   ```bash
   npx tsx prisma/seed-demo.js --reset
   npm run dev
   ```

   API tersedia di `http://localhost:3000/api`.

## Akun demo (hanya development)

- `owner@demo.com` (role OWNER)
- `manager@demo.com` (role MANAGER)

Password default ada di `prisma/seed.js`, dan bisa diganti lewat variabel `SEED_PASSWORD` di `.env` sebelum menjalankan seed.

## Data demo

`prisma/seed-demo.js` mengisi 16 product sembako beserta transaksi 30 hari terakhir (penjualan, pembatalan, barang rusak, koreksi, dan beberapa data yang menunggu persetujuan). Script ini **menghapus** semua product dan transaksi, jadi ia menolak berjalan tanpa `--reset`, dan menolak kalau database bukan di `localhost`. Rentang data mengikuti hari saat script dijalankan, jadi jalankan ulang sebelum demo supaya dashboard terisi sampai hari ini.

## Script

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Jalankan server development |
| `npm test` | Jalankan unit test (Mocha) |
| `npx prisma studio` | Lihat isi database di browser |
| `. .\scripts\dev-helpers.ps1` | (PowerShell) muat fungsi bantu untuk tes manual API |

## Struktur folder

- `src/app/api/` : route handler (endpoint), hanya mengurus HTTP
- `src/services/` : logic bisnis yang memakai database (transaksi stok, penjualan, dashboard)
- `src/domain/` : aturan bisnis murni tanpa database (hitung HPP, periode, pembatas login)
- `src/validators/` : validasi dan pembersihan input
- `src/serializers/` : bentuk data yang dikirim ke client
- `src/lib/` : infrastruktur bersama (Prisma client, auth, format response)
- `prisma/` : schema, migrasi, dan seed
- `scripts/` : skrip bantu untuk tes manual (PowerShell)
- `test/` : unit test, mengikuti struktur `src/`
- `docs/` : dokumentasi API

## Catatan deploy

- Database harus di-host (bukan Docker lokal). Pakai connection string yang di-pool, dan samakan region server dengan region database.
- Gunakan `JWT_SECRET` baru yang kuat, isi `CORS_ORIGIN` dengan domain frontend, dan jalankan `prisma migrate deploy` (bukan `migrate dev`).
- Jangan menjalankan `seed.js` dengan password default di server publik, dan jangan menjalankan `seed-demo.js` terhadap data sungguhan.
- Pembatas percobaan login disimpan di memori proses. Itu cukup untuk satu server, tapi di platform serverless tiap instance punya hitungan sendiri. Untuk itu perlu penyimpanan bersama (misalnya Redis).

## Keterbatasan yang diketahui

- Penolakan adjustment belum menyimpan alasan.
- Belum ada resep (bahan per menu), jadi belum cocok langsung untuk resto.
- Belum ada penyegaran token (token berlaku 8 jam).
- Zona waktu laporan tetap WIB.