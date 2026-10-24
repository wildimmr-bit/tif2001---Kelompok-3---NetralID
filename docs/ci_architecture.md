# Arsitektur CI HitungModal

Dokumen ini menjelaskan pipeline Continuous Integration (CI) di `.github/workflows/ci.yml`.

## Trigger

| Event | Kondisi |
|---|---|
| `push` | Setiap push ke branch `main` |
| `pull_request` | Setiap Pull Request yang menuju branch `main` |

## Job

Dua job berjalan paralel di `ubuntu-latest`.

| Job | Folder kerja | Langkah |
|---|---|---|
| `frontend` (Frontend Lint & Test) | `client/` | Checkout kode, setup Node.js 20 (cache npm), `npm ci`, `npm run lint`, `npm test` |
| `backend` (Backend Lint & Test) | `server/` | Checkout kode, setup Node.js 20 (cache npm), `npm ci`, `npm run lint`, `npm test` |

Jika salah satu langkah gagal, job menjadi merah dan status check pada Pull Request ikut gagal.

## Alat pengujian

| Bagian | Alat | Perintah |
|---|---|---|
| Backend | Jest | `npm test` |
| Frontend | Vitest | `npm test` (menjalankan `vitest run`) |

Daftar skenario uji ada di `docs/test_matrix.md`.

## Aturan proteksi branch `main`

| Aturan | Status |
|---|---|
| Perubahan wajib lewat Pull Request | Aktif |
| Minimal 1 approval dari anggota lain | Aktif |
| Status check `Frontend Lint & Test` dan `Backend Lint & Test` wajib lulus sebelum merge | [Aktif / Belum diaktifkan] |

Baris terakhir diisi sesuai kondisi sebenarnya di **Settings > Branches** setelah pengaturan dilakukan.

## Syarat agar CI berjalan

- `client/` dan `server/` masing-masing memiliki `package-lock.json` yang sinkron dengan `package.json` (dipakai oleh `npm ci` dan cache npm).
- Script `lint` dan `test` terdefinisi di `package.json` kedua folder.
- Unit test tidak bergantung pada database atau secret asli.
- Perubahan pada `package.json` dan `package-lock.json` selalu di-commit bersamaan.

## Riwayat perubahan

| Pertemuan | Perubahan |
|---|---|
| 7 | Langkah test dinonaktifkan sementara karena script `test` bawaan `npm init` berisi `exit 1` |
| 8 | Script `test` diganti (`jest` dan `vitest run`), unit test autentikasi ditambahkan, dan langkah test diaktifkan kembali di CI |

## Cara membaca hasil

Buka Pull Request dan lihat bagian **Checks**, atau buka tab **Actions** di repositori. Centang hijau berarti lolos, tanda silang merah berarti gagal. Klik nama job, lalu cari langkah yang bertanda silang untuk melihat log error.

Tips: tombol **Re-run jobs** menjalankan ulang commit yang sama. Untuk memakai perubahan terbaru, perbarui branch dengan `main` lalu push commit baru.