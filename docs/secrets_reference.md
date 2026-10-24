# Referensi Variabel Rahasia

Dokumen ini hanya mencatat **nama dan fungsi** variabel. Nilai asli tidak boleh ditulis di repositori, di komentar Pull Request, maupun di grup chat.

## Variabel aplikasi

| Nama | Lokasi | Fungsi | Rahasia? |
|---|---|---|---|
| `DATABASE_URL` | `server/.env` | Alamat koneksi ke database PostgreSQL (Neon) | Ya |
| `JWT_SECRET` | `server/.env` | Kunci untuk menandatangani dan memverifikasi token JWT | Ya |
| `PORT` | `server/.env` | Port tempat server backend berjalan | Tidak |
| `CLIENT_URL` | `server/.env` | Alamat frontend yang diizinkan oleh CORS | Tidak |
| `VITE_API_URL` | `client/.env` | Alamat API backend yang dipanggil frontend | Tidak |

Variabel berawalan `VITE_` ikut tertanam di hasil build frontend dan terlihat oleh pengguna, sehingga tidak boleh berisi rahasia.

## Aturan

- File `.env` tidak boleh di-commit dan harus tercantum di `.gitignore`.
- Setiap folder (`client/` dan `server/`) menyediakan `.env.example` berisi nama variabel tanpa nilai asli.
- Nilai asli dibagikan antaranggota lewat jalur yang aman, bukan lewat repositori.
- Kredensial tidak boleh tertulis langsung di dalam kode.

## Variabel di CI (GitHub Actions)

| Nama | Dipakai di | Fungsi |
|---|---|---|
| Tidak ada | `.github/workflows/ci.yml` | Pipeline CI saat ini tidak membutuhkan secret |

Unit test tidak menyentuh database asli. Test backend mengisi `JWT_SECRET` dengan nilai palsu di dalam file test, dan test frontend hanya menguji fungsi validasi. Jika suatu saat test memerlukan secret, tambahkan lewat **Settings > Secrets and variables > Actions**, lalu catat namanya pada tabel di atas.

## Jika sebuah secret bocor

1. Anggap secret tersebut tidak aman, lalu ganti nilainya di sumbernya (kata sandi database di Neon, atau buat `JWT_SECRET` baru).
2. Perbarui nilai baru di `.env` lokal setiap anggota dan di tempat deploy.
3. Beri tahu seluruh tim.
4. Jika file rahasia sudah masuk ke riwayat Git, hapus dari riwayat sesuai prosedur yang disepakati tim.