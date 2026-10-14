# Arsitektur CI HitungModal

Dokumen ini menjelaskan pipeline Continuous Integration (CI) di `.github/workflows/ci.yml`.

## Trigger

| Event | Kondisi |
|---|---|
| `push` | Setiap push ke branch `main` |
| `pull_request` | Setiap Pull Request yang menuju branch `main` |

## Job

Dua job berjalan paralel di `ubuntu-latest`.

| Job | Folder kerja | Langkah aktif |
|---|---|---|
| `frontend` (Frontend Lint & Test) | `client/` | Checkout kode, setup Node.js 20 (cache npm), `npm ci`, `npm run lint --if-present` |
| `backend` (Backend Lint & Test) | `server/` | Checkout kode, setup Node.js 20 (cache npm), `npm ci`, `npm run lint --if-present` |

Jika salah satu job gagal, status check pada Pull Request menjadi merah.

## Langkah test dinonaktifkan sementara

Langkah `npm test --if-present` di kedua job dijadikan komentar di `ci.yml`.

Alasannya: `npm init` membuat script `test` bawaan di `package.json` yang berisi `echo "Error: no test specified" && exit 1`. Karena script itu ada, flag `--if-present` tidak melewati langkahnya, sehingga job backend gagal walaupun kodenya benar. Unit test baru ditambahkan pada Pertemuan 8, jadi langkah ini akan diaktifkan kembali setelah Jest dipasang dan test pertama ditulis.

## Syarat agar CI berjalan

- `client/` dan `server/` masing-masing harus punya `package-lock.json` (dipakai oleh `npm ci` dan cache npm). Jika tidak ada, langkah setup Node gagal dengan pesan "unable to cache dependencies".
- Script `lint` didefinisikan di `package.json` tiap folder. Contoh: `"lint": "eslint ."`.
- Flag `--if-present` membuat langkah lint dilewati jika script belum ada. Akibatnya CI bisa berstatus hijau tanpa benar-benar memeriksa kode, jadi script lint harus segera dilengkapi.

## Aturan status check

- Pada Pertemuan 7, fokus pada linting otomatis di setiap Pull Request.
- Pada Pertemuan 8, unit test ditambahkan, langkah test diaktifkan kembali, dan branch protection diaktifkan: Pull Request hanya bisa di-merge jika seluruh check berstatus hijau.

## Cara membaca hasil

Buka Pull Request dan lihat bagian **Checks** di bagian bawah, atau buka tab **Actions** di repositori. Centang hijau berarti lolos, tanda silang merah berarti gagal. Klik nama job untuk melihat log error.