# Matriks Pengujian Modul Autentikasi

Dokumen ini merangkum skenario unit test modul autentikasi. Kolom Status dan angka coverage diisi dari hasil `npm test` yang sebenarnya, bukan perkiraan.

## Ringkasan

| Bagian | Alat uji | Jumlah skenario | Lolos | Gagal |
|---|---|---|---|---|
| Backend (`server/`) | Jest | 9 | [isi] | [isi] |
| Frontend (`client/`) | Vitest | 20 | [isi] | [isi] |
| **Total** | | 29 | [isi] | [isi] |

Jumlah skenario sesuai jumlah test pada `server/tests/auth.test.js` dan `client/src/utils/validation.test.js`. Jika test ditambah atau dikurangi, perbarui tabel ini.

## Code coverage

Backend diambil dari `npx jest --coverage`. Frontend diisi hanya jika pengukuran coverage sudah dijalankan, jika belum tulis "Belum diukur".

| Bagian | Statements | Branches | Functions | Lines |
|---|---|---|---|---|
| Backend | [isi]% | [isi]% | [isi]% | [isi]% |
| Frontend | [isi / Belum diukur] | | | |

## Backend: hashing password dan token JWT

File: `server/tests/auth.test.js`, modul yang diuji: `server/src/utils/auth.js`.

| ID | Jenis | Skenario | Hasil yang diharapkan | Status |
|---|---|---|---|---|
| BE-01 | Positive | Hash password | Hash berbeda dari teks asli | [Lulus/Gagal] |
| BE-02 | Positive | Compare password yang cocok | Mengembalikan `true` | [Lulus/Gagal] |
| BE-03 | Negative | Compare password yang berbeda | Mengembalikan `false` | [Lulus/Gagal] |
| BE-04 | Positive | Dua hash dari password yang sama | Hasil berbeda (salt acak) | [Lulus/Gagal] |
| BE-05 | Positive | Token berisi data pengguna | Payload memuat `id` dan `role` | [Lulus/Gagal] |
| BE-06 | Boundary | Masa berlaku token | Tepat 24 jam | [Lulus/Gagal] |
| BE-07 | Negative | Token ditandatangani secret lain | Verifikasi melempar error | [Lulus/Gagal] |
| BE-08 | Negative | Token kedaluwarsa | Verifikasi melempar error | [Lulus/Gagal] |
| BE-09 | Negative | Teks yang bukan JWT | Verifikasi melempar error | [Lulus/Gagal] |

## Frontend: validasi form

File: `client/src/utils/validation.test.js`, modul yang diuji: `client/src/utils/validation.js`.

| ID | Jenis | Skenario | Hasil yang diharapkan | Status |
|---|---|---|---|---|
| FE-01 | Positive | Nama valid | String kosong (tanpa error) | [Lulus/Gagal] |
| FE-02 | Negative | Nama kosong | "Nama wajib diisi" | [Lulus/Gagal] |
| FE-03 | Negative | Nama hanya spasi | "Nama wajib diisi" | [Lulus/Gagal] |
| FE-04 | Boundary | Nama 2 karakter | "Nama minimal 3 karakter" | [Lulus/Gagal] |
| FE-05 | Boundary | Nama tepat 3 karakter | Tanpa error | [Lulus/Gagal] |
| FE-06 | Boundary | Nama dengan spasi di tepi (` Al `) | "Nama minimal 3 karakter" | [Lulus/Gagal] |
| FE-07 | Positive | Email valid | Tanpa error | [Lulus/Gagal] |
| FE-08 | Negative | Email kosong | "Email wajib diisi" | [Lulus/Gagal] |
| FE-09 | Negative | Email hanya spasi | "Email wajib diisi" | [Lulus/Gagal] |
| FE-10 | Negative | Email tanpa `@` | "Format email tidak valid" | [Lulus/Gagal] |
| FE-11 | Negative | Email tanpa titik pada domain | "Format email tidak valid" | [Lulus/Gagal] |
| FE-12 | Negative | Email mengandung spasi | "Format email tidak valid" | [Lulus/Gagal] |
| FE-13 | Positive | Password valid | Tanpa error | [Lulus/Gagal] |
| FE-14 | Negative | Password kosong | "Password wajib diisi" | [Lulus/Gagal] |
| FE-15 | Boundary | Password 7 karakter | "Password minimal 8 karakter" | [Lulus/Gagal] |
| FE-16 | Boundary | Password tepat 8 karakter | Tanpa error | [Lulus/Gagal] |
| FE-17 | Positive | Konfirmasi sama dengan password | Tanpa error | [Lulus/Gagal] |
| FE-18 | Negative | Konfirmasi kosong | "Konfirmasi password wajib diisi" | [Lulus/Gagal] |
| FE-19 | Negative | Konfirmasi berbeda | "Konfirmasi password tidak sama" | [Lulus/Gagal] |
| FE-20 | Negative | Konfirmasi beda huruf besar/kecil | "Konfirmasi password tidak sama" | [Lulus/Gagal] |

## Belum diuji

- Endpoint register, login, dan `/auth/me` (membutuhkan database atau mock) diuji manual dengan Thunder Client atau Postman.
- Tampilan halaman Login dan Register.

## Catatan

- Password yang terdiri dari spasi saja saat ini diterima oleh `validatePassword`. Perilaku ini belum diputuskan tim dan tidak dikunci oleh test.