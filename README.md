# tif2001 Kelompok 3 NetralID
Proyek Pengembangan Aplikasi  Costly - TIF2001 Software Development
nama kelompok dan tugas
1. Moh. Faktur Rohman (Frontend & UI/UX Specialist)
2. Wildanul Ikhsan (Backend & Database Engineer)
3. Mohammad Mahfudin (QA, DevOps & Integration Specialist)

Aplikasi Kalkulator HPP

1. Latar Belakang Masalah
Banyak pelaku UMKM kuliner rumahan menentukan harga jual dengan cara kira-kira atau mengikuti harga penjual lain. Biaya kecil seperti gas, kemasan, dan upah diri sendiri sering tidak dihitung. Akibatnya, produk terlihat laku tapi uangnya tidak bertambah.
Masalah lain muncul saat harga bahan naik, misalnya telur, minyak, atau cokelat. Pemilik usaha jarang menghitung ulang modalnya, sehingga untung per produk pelan-pelan menyusut tanpa disadari. Saat berjualan lewat marketplace atau GoFood, potongan fee dan ongkir juga membuat untung yang diterima lebih kecil dari perkiraan.

3. Solusi Aplikasi
HitungModal membantu pemilik usaha mengetahui modal sebenarnya per produk dan harga jual yang aman untuk tiap tempat berjualan. Pengguna cukup memasukkan resep dan harga bahan satu kali. Setelah itu aplikasi menghitung modal per produk secara otomatis, termasuk gas, kemasan, tenaga kerja, dan biaya lain.
Kalau harga bahan diperbarui, modal dan harga jual semua produk yang memakai bahan itu ikut berubah, dan pengguna diberi tahu kalau untungnya turun. Aplikasi juga menampilkan harga yang disarankan untuk toko sendiri, Shopee, GoFood, dan WhatsApp, lengkap dengan potongan fee masing-masing.

4. Target Pengguna dan Hak Akses
Pemilik Usaha: Mengisi data bahan dan resep, mengatur biaya tambahan, melihat modal dan untung per produk, serta melihat harga jual yang disarankan per saluran penjualan.
Karyawan (opsional): Memperbarui harga bahan setelah belanja dan mencatat produksi harian. Tidak bisa melihat laporan untung rugi.
Admin Sistem: Mengelola template resep per jenis usaha dan daftar fee marketplace yang berlaku.

6. Peta Alur Fitur Aplikasi
+--------------------------------------------------------------+
|                 HALAMAN PUBLIK DAN LOGIN                     |
+--------------------------------------------------------------+
| [ Beranda ] -> [ Kalkulator Contoh ] -> [ Daftar / Login ]   |
+--------------------------------------------------------------+
                            |
                            v
                  [ PEMBATASAN HAK AKSES ]
                            |
        +-------------------+-------------------+
        |                   |                   |
        v                   v                   v
+---------------+   +---------------+   +---------------+
| PEMILIK USAHA |   |   KARYAWAN    |   |  ADMIN SISTEM |
+---------------+   +---------------+   +---------------+
| 1. Bahan      |   | 1. Update     |   | 1. Template   |
|  - Daftar     |   |    harga      |   |    resep      |
|    bahan      |   |    belanja    |   |  - Per jenis  |
|  - Harga      |   |               |   |    usaha      |
|    terbaru    |   | 2. Catat      |   |               |
|               |   |    produksi   |   | 2. Fee        |
| 2. Produk     |   |    harian     |   |    marketplace|
|  - Resep      |   |               |   |  - Shopee,    |
|  - Biaya lain |   |               |   |    GoFood,    |
|  - Susut      |   |               |   |    dll        |
|               |   |               |   |               |
| 3. Harga Jual |   |               |   |               |
|  - Per saluran|   |               |   |               |
|  - Simulasi   |   |               |   |               |
|               |   |               |   |               |
| 4. Laporan    |   |               |   |               |
|  - Untung     |   |               |   |               |
|  - Titik impas|   |               |   |               |
+---------------+   +---------------+   +---------------+
        |                   |                   |
        +-------------------+-------------------+
                            |
                            v
+--------------------------------------------------------------+
|                    LAYANAN PENDUKUNG                         |
+--------------------------------------------------------------+
| - Mesin hitung modal dan harga jual                          |
| - Pemberitahuan saat untung produk turun                     |
| - Penyimpanan riwayat perubahan harga bahan                  |
| - Validasi isian form                                        |
+--------------------------------------------------------------+

5. Fitur Utama Sistem
Hitung Modal per Produk: Modal dihitung dari bahan, tenaga kerja, gas dan listrik, kemasan, serta biaya lain yang dibagi ke tiap produk.
Harga Bahan Otomatis Berpengaruh: Saat harga satu bahan diubah, semua produk yang memakainya dihitung ulang. Pengguna menerima pemberitahuan kalau untung sebuah produk turun.
Harga Jual per Saluran: Satu produk punya beberapa harga yang disarankan (toko sendiri, Shopee, GoFood, WhatsApp), sudah memasukkan fee dan promo tiap saluran.
Bantuan Biaya Tersembunyi: Aplikasi bertanya hal sederhana seperti “Berapa tabung gas sebulan?” dan “Berapa jam kamu bekerja per hari?”, lalu membagi biayanya ke tiap produk.
Simulasi “Bagaimana Kalau”: Pengguna bisa mencoba skenario seperti harga naik Rp2.000, ganti kemasan, atau diskon 10%, lalu melihat dampaknya ke untung.
Titik Impas dan Target Harian: Menampilkan jumlah produk minimal yang harus terjual per hari agar usaha tidak rugi.
Hitungan Susut dan Produk Gagal: Persentase produk gagal atau tidak laku ikut dimasukkan ke modal.
Template Resep Siap Pakai: Contoh resep untuk brownies, kopi, ayam geprek, dan lainnya, supaya pengguna baru tidak mulai dari nol.

7. Tumpukan Teknologi (Tech Stack)
Antarmuka (Frontend): React.js (Vite), Tailwind CSS, Axios.
Server (Backend): Node.js dan Express.js (REST API), JWT dan Bcrypt untuk login.
Basis Data: PostgreSQL (Neon).
Hosting: Vercel (frontend) dan Render (backend).
