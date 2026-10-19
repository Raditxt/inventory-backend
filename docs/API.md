# API Inventory & Penjualan (v0 draft)

Base URL (dev): `http://localhost:3000/api`
Format: semua request dan response berupa JSON.

## Aturan umum

**Autentikasi.** Setelah login, kirim token di setiap request:

    Authorization: Bearer <token>

Token berlaku 8 jam. Kalau habis, server membalas 401 dan FE harus mengarahkan user ke halaman login.

**Format response sukses**

    { "data": { ... } }

**Format response error**

    { "error": { "code": "INVALID_CREDENTIALS", "message": "Email atau password salah" } }

FE cukup menampilkan `message` ke user dan memakai `code` untuk logika.

**Kode status**

| Status | Arti |
|---|---|
| 200 / 201 | Berhasil / berhasil dibuat |
| 400 | Input salah (`VALIDATION_ERROR`, `INVALID_JSON`) |
| 401 | Belum login atau token tidak valid (`UNAUTHORIZED`, `INVALID_CREDENTIALS`) |
| 403 | Role tidak punya izin (`FORBIDDEN`) |
| 404 | Data tidak ditemukan (`NOT_FOUND`) |
| 409 | Bentrok aturan bisnis (misal stok tidak cukup) |

**Role:** `OWNER` dan `MANAGER`.

---

## Auth

### POST /auth/login
Tanpa token.

Request:

    { "email": "owner@demo.com", "password": "..." }

Response 200:

    {
      "data": {
        "token": "eyJhbGciOi...",
        "user": { "id": 1, "name": "Owner", "email": "owner@demo.com", "role": "OWNER" }
      }
    }

Error: 400 `VALIDATION_ERROR`, 401 `INVALID_CREDENTIALS`.

### GET /auth/me
Butuh token. Dipakai FE untuk cek sesi dan mengambil role saat halaman dibuka ulang.

Response 200:

    { "data": { "user": { "id": 1, "name": "Owner", "email": "owner@demo.com", "role": "OWNER" } } }

Error: 401 `UNAUTHORIZED`.

---

---
## Products

Objek product:

    {
      "id": 1,
      "sku": "BRS-001",
      "name": "Beras 5kg",
      "category": "Sembako",
      "unit": "karung",
      "price": 65000,
      "avgCost": 0,
      "stock": 0,
      "minStock": 10,
      "status": "ACTIVE",
      "createdAt": "2026-10-16T08:00:00.000Z"
    }

`status`: `ACTIVE` atau `PENDING_APPROVAL`. `stock` dan `avgCost` (HPP weighted average) tidak bisa diisi lewat endpoint products, keduanya berubah lewat barang masuk dan penjualan.

Hak akses:

| Endpoint | OWNER | MANAGER |
|---|---|---|
| GET /products, GET /products/:id | ya | ya |
| POST /products | ya (langsung ACTIVE) | ya (jadi PENDING_APPROVAL) |
| PATCH /products/:id | ya | hanya product miliknya yang masih PENDING_APPROVAL |
| DELETE /products/:id | ya | tidak |
| POST /products/:id/approve | ya | tidak |

### GET /products
Query opsional: `search` (nama atau SKU), `category`, `status`, `page` (default 1), `limit` (default 20, maksimal 100).

Response 200:

    { "data": { "items": [ { ...product } ], "page": 1, "limit": 20, "total": 1 } }

### POST /products
Request (semua wajib kecuali `minStock`, default 0):

    { "sku": "BRS-001", "name": "Beras 5kg", "category": "Sembako",
      "unit": "karung", "price": 65000, "minStock": 10 }

Response 201: `{ "data": { "product": { ... } } }`
Error: 400 `VALIDATION_ERROR`, 403, 409 `SKU_TAKEN`.

### GET /products/:id
Response 200: `{ "data": { "product": { ... } } }`. Error: 404 `NOT_FOUND`.

### PATCH /products/:id
Kirim hanya field yang diubah: `sku`, `name`, `category`, `unit`, `price`, `minStock`.
Response 200: `{ "data": { "product": { ... } } }`
Error: 400, 403 `FORBIDDEN`, 404, 409 `SKU_TAKEN`.

### DELETE /products/:id
Hanya OWNER. Product yang sudah punya riwayat (barang masuk, penjualan, dst) tidak bisa dihapus. Menolak product pending dari manager = menghapusnya.
Response 200: `{ "data": { "id": 1 } }`
Error: 404, 409 `HAS_HISTORY`.

### POST /products/:id/approve
Hanya OWNER. Mengubah status `PENDING_APPROVAL` menjadi `ACTIVE`. Tanpa body.
Response 200: `{ "data": { "product": { ... } } }`
Error: 404, 409 `NOT_PENDING`.

---

---
## Barang masuk (stock-ins)

Mencatat barang masuk untuk product `ACTIVE`. Dalam satu transaksi, server menambah `stock`, menghitung ulang `avgCost` (weighted average), dan mencatat riwayat stok. Akses: OWNER dan MANAGER.

### POST /stock-ins
Request (semua wajib, bertipe angka, bukan string):

    { "productId": 1, "qty": 10, "unitCost": 50000 }

- `qty`: bilangan bulat > 0
- `unitCost`: harga beli per unit, >= 0

Response 201:

    {
      "data": {
        "stockIn": { "id": 1, "productId": 1, "qty": 10, "unitCost": 50000, "createdAt": "..." },
        "product": { "id": 1, "sku": "BRS-001", "stock": 10, "avgCost": 50000, "...": "..." }
      }
    }

`product` berisi kondisi terbaru setelah barang masuk. FE bisa langsung memakainya untuk memperbarui tampilan.

Error: 400 `VALIDATION_ERROR`, 401, 404 `NOT_FOUND`, 409 `PRODUCT_NOT_ACTIVE`.

### GET /stock-ins
Query opsional: `productId`, `page` (default 1), `limit` (default 20, maksimal 100). Urut dari yang terbaru.

Response 200:

    {
      "data": {
        "items": [
          { "id": 2, "productId": 1, "qty": 10, "unitCost": 60000, "createdAt": "...",
            "product": { "id": 1, "sku": "BRS-001", "name": "Beras 5kg" },
            "createdBy": { "id": 2, "name": "Manager" } }
        ],
        "page": 1, "limit": 20, "total": 2
      }
    }
---

## Akun demo (hanya development)

- owner@demo.com
- manager@demo.com

Password dikirim terpisah.

## Segera menyusul
Products, barang masuk, penjualan, adjustment/barang rusak, riwayat stok, dashboard.