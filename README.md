# Inventory Backend

Backend sistem inventory, penjualan, dan dashboard untuk demo portfolio.
Dibangun dengan Next.js (API routes), Prisma 7, dan PostgreSQL.

Dokumentasi API: [docs/API.md](docs/API.md)

## Fitur

- Login dengan 2 role: `OWNER` dan `MANAGER`
- Manajemen product, barang masuk, penjualan, barang rusak, dan stock adjustment
- Riwayat perubahan stok (`stock_movements`) dan dashboard laporan

Status: dalam pengembangan. Saat ini baru endpoint auth yang tersedia.

## Prasyarat

- Node.js (versi LTS)
- Docker (untuk PostgreSQL lokal)

## Cara menjalankan

1. Clone repo, lalu salin file environment:

```bash
   cp .env.example .env
```

   (di PowerShell: `Copy-Item .env.example .env`)

2. Jalankan PostgreSQL lewat Docker:

```bash
   docker run --name inventory-db -e POSTGRES_PASSWORD=rahasia123 -e POSTGRES_DB=inventory -p 5433:5432 -d postgres:16
```

3. Isi `.env`. Sesuaikan port dengan perintah Docker di atas:

```
   DATABASE_URL="postgresql://postgres:rahasia123@localhost:5433/inventory"
   JWT_SECRET="isi-dengan-string-acak"
```

   Cara membuat `JWT_SECRET` acak: `node -p "require('crypto').randomBytes(32).toString('hex')"`

4. Install dependency, lalu buat tabel dan data awal:

```bash
   npm install
   npx prisma migrate dev
   npx tsx prisma/seed.js
```

5. Jalankan server development:

```bash
   npm run dev
```

   API tersedia di `http://localhost:3000/api`.

## Akun demo (development)

- `owner@demo.com` (role OWNER)
- `manager@demo.com` (role MANAGER)

Password default ada di `prisma/seed.js`, dan bisa diganti lewat variabel `SEED_PASSWORD` di `.env`.

## Script

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Jalankan server development |
| `npm test` | Jalankan unit test (Mocha) |
| `npx prisma studio` | Lihat isi database di browser |

## Struktur folder

- `app/api/` : route API (endpoint)
- `lib/` : fungsi bersama (auth, format response, Prisma client, hitung HPP)
- `prisma/` : schema, migrasi, dan seed
- `test/` : unit test
- `docs/` : dokumentasi API