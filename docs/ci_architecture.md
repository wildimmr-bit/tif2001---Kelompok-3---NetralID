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
| `frontend` (Frontend Lint & Test) | `client/` | Checkout kode, setup Node.js 20 (cache npm), `npm ci`, `npm run lint --if-present`, `npm test --if-present` |
| `backend` (Backend Lint & Test) | `server/` | Checkout kode, setup Node.js 20 (cache npm), `npm ci`, `npm run lint --if-present`, `npm test --if-present` |

Jika salah satu job gagal, status check pada Pull Request menjadi merah.

## Syarat agar CI berjalan

- `client/` dan `server/` masing-masing harus punya `package-lock.json` (dipakai oleh `npm ci` dan cache npm).
- Script `lint` dan `test` didefinisikan di `package.json` tiap folder. Contoh: `"lint": "eslint ."`.
- Flag `--if-present` membuat langkah dilewati jika script belum ada. Akibatnya CI bisa berstatus hijau tanpa benar-benar memeriksa kode, jadi script harus segera dilengkapi.

## Aturan status check

- Pada Pertemuan 7, fokus pada linting otomatis di setiap Pull Request.
- Pada Pertemuan 8, unit test ditambahkan dan branch protection diaktifkan: Pull Request hanya bisa di-merge jika seluruh check berstatus hijau.

## Cara membaca hasil

Buka Pull Request dan lihat bagian **Checks** di bagian bawah, atau buka tab **Actions** di repositori. Centang hijau berarti lolos, tanda silang merah berarti gagal. Klik nama job untuk melihat log error.