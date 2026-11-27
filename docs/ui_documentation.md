## Desain
- Wireframe dan mockup UI (Figma): [lihat desain](https://www.figma.com/design/Sz3p4p0JdVHCmQRUR9rYzp/projek-aplikasi-web-softdev?node-id=0-1&t=BTKndcFteQyZnvaN-1)

Isian	Aturan	Pesan galat
Nama bahan	Wajib, maksimal 100 karakter	Nama bahan wajib diisi, Nama bahan maksimal 100 karakter
Satuan	Wajib dipilih	Satuan wajib dipilih
Jumlah	Wajib, angka lebih dari 0, boleh desimal dengan koma atau titik	Jumlah beli wajib diisi, Jumlah beli harus berupa angka, Jumlah beli harus lebih dari 0
Harga	Wajib, angka bulat tanpa titik dan koma	Harga beli wajib diisi, Harga diisi angka saja, tanpa titik atau komaexit

Halaman Bahan dan alurnya: login berhasil lalu halaman Bahan, dan halaman itu hanya bisa dibuka setelah login.
Komponen yang benar-benar dipakai (ProtectedRoute, FormInput untuk Login dan Register).
Aturan validasi form bahan (nama wajib dan maksimal 100 karakter, satuan wajib dipilih, jumlah lebih dari 0 dan boleh desimal, harga angka bulat tanpa titik dan koma).

Fitur baru halaman Bahan: pencarian (permintaan ditunda 400 ms setelah berhenti mengetik), filter kategori (lebih dari satu boleh dipilih), paginasi (10 bahan per halaman, tombol Sebelumnya, nomor, dan Berikutnya), pilihan kategori dan unggah gambar di formulir.
Aturan gambar: maksimal 2 MB, hanya JPEG, PNG, dan WebP. Dicek di klien sebagai pemberitahuan cepat, dan diperiksa ulang oleh server.
Pesan galat baru: Gambar harus berformat JPEG, PNG, atau WebP, Ukuran gambar maksimal 2 MB, Tidak ada bahan yang cocok dengan pencarian atau filter ini, dan Bahan tersimpan, tetapi gambar gagal diunggah: .