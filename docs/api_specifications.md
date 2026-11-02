# API Specifications: Modul Autentikasi

Dokumen ini merinci kontrak REST API modul autentikasi NetralID sesuai implementasi di `server/src/controllers/authController.js`. Semua contoh balasan berasal dari hasil uji langsung ke server lokal.

## Informasi Umum

| Item | Nilai |
|---|---|
| Base URL (lokal) | `http://localhost:5000/api/v1/auth` |
| Port | Nilai `PORT` di `server/.env` (contoh: `5000`) |
| Format data | JSON |
| Header wajib (request body) | `Content-Type: application/json` |

Endpoint yang tersedia saat ini hanya `POST /register` dan `POST /login`.

---

## 1. Register Pengguna

Mendaftarkan pengguna baru. Password dienkripsi dengan bcryptjs (salt rounds: 10) sebelum disimpan.

- **Method:** `POST`
- **URL:** `/api/v1/auth/register`

### Request Body

| Field | Tipe | Wajib | Aturan |
|---|---|---|---|
| `name` | string | Ya | Tidak boleh kosong |
| `email` | string | Ya | Tidak boleh kosong, harus unik |
| `password` | string | Ya | Minimal 8 karakter |

```json
{
  "name": "Uji Tiga",
  "email": "uji3@example.com",
  "password": "rahasia123"
}
```

### Response Sukses: `201 Created`

```json
{
  "message": "Registrasi berhasil",
  "data": {
    "id": "8e69bc7e-af5b-4213-8191-95db7ea75c83",
    "name": "Uji Tiga",
    "email": "uji3@example.com",
    "role": "user",
    "created_at": "2026-10-30T00:49:38.555Z"
  }
}
```

Password dan hash password tidak pernah dikembalikan.

### Response Galat

| Status | Kondisi | Body |
|---|---|---|
| `400 Bad Request` | `name`, `email`, atau `password` kosong/tidak dikirim | `{"message": "Nama, email, dan password wajib diisi"}` |
| `400 Bad Request` | `password` kurang dari 8 karakter | `{"message": "Password minimal 8 karakter"}` |
| `409 Conflict` | Email sudah terdaftar | `{"message": "Email sudah terdaftar"}` |
| `500 Internal Server Error` | Kesalahan server, misalnya database tidak terhubung | `{"message": "Terjadi kesalahan server"}` |

---

## 2. Login Pengguna

Memverifikasi kredensial dan menerbitkan JSON Web Token (JWT).

- **Method:** `POST`
- **URL:** `/api/v1/auth/login`

### Request Body

| Field | Tipe | Wajib | Aturan |
|---|---|---|---|
| `email` | string | Ya | Tidak boleh kosong |
| `password` | string | Ya | Tidak boleh kosong |

```json
{
  "email": "uji3@example.com",
  "password": "rahasia123"
}
```

### Response Sukses: `200 OK`

`message` dan `token` berada di level atas balasan, sedangkan data pengguna ada di dalam `user`.

```json
{
  "message": "Login berhasil",
  "token": "<JWT>",
  "user": {
    "id": "8e69bc7e-af5b-4213-8191-95db7ea75c83",
    "name": "Uji Tiga",
    "email": "uji3@example.com",
    "role": "user"
  }
}
```

### Response Galat

| Status | Kondisi | Body |
|---|---|---|
| `400 Bad Request` | `email` atau `password` kosong/tidak dikirim | `{"message": "Email dan password wajib diisi"}` |
| `401 Unauthorized` | Email tidak terdaftar | `{"message": "Email atau password salah"}` |
| `401 Unauthorized` | Password salah | `{"message": "Email atau password salah"}` |
| `500 Internal Server Error` | Kesalahan server | `{"message": "Terjadi kesalahan server"}` |

Pesan untuk email tidak terdaftar dan password salah sengaja dibuat sama agar tidak membocorkan informasi apakah suatu email sudah terdaftar.

---

## 3. Token JWT

| Item | Nilai |
|---|---|
| Algoritma | HS256 |
| Masa berlaku | 24 jam |
| Payload | `id` (ID pengguna), `role`, `iat`, `exp` |
| Secret | Variabel lingkungan `JWT_SECRET` (tidak boleh di-commit) |

Pembuatan dan verifikasi token ada di `server/src/utils/auth.js`. Middleware `server/src/middlewares/verifyToken.js` membaca header `Authorization: Bearer <token>` dan menjawab `401` dengan pesan `Token tidak valid atau kedaluwarsa` bila token salah atau kedaluwarsa. Middleware ini disiapkan untuk melindungi endpoint privat, tetapi belum dipasang pada route mana pun pada Sprint 1.

---

## 4. Ringkasan Kode Status

| Status | Arti | Endpoint |
|---|---|---|
| `200` | Login berhasil | `/login` |
| `201` | Registrasi berhasil | `/register` |
| `400` | Input tidak valid atau tidak lengkap | `/register`, `/login` |
| `401` | Kredensial salah | `/login` |
| `409` | Email sudah terdaftar | `/register` |
| `500` | Kesalahan server | `/register`, `/login` |

## 5. Contoh Pemanggilan (curl)

```bash
# Register
curl -i -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Uji Tiga","email":"uji3@example.com","password":"rahasia123"}'

# Login
curl -i -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"uji3@example.com","password":"rahasia123"}'
```
