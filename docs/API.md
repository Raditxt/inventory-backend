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

## Akun demo (hanya development)

- owner@demo.com
- manager@demo.com

Password dikirim terpisah.

## Segera menyusul
Products, barang masuk, penjualan, adjustment/barang rusak, riwayat stok, dashboard.