# Changelog

Semua perubahan penting pada proyek ini dicatat di sini. Format mengikuti Conventional Commits.

## [Sprint 1] Fondasi Sistem dan Modul Autentikasi

### Fitur (feat)
- feat(server): endpoint register, login, dan `/auth/me` dengan JWT dan bcrypt (PR #18)
- feat(client): halaman Login dan Register dengan validasi form (PR #17)

### Pengujian (test)
- test(client): unit test validasi form dengan Vitest (PR #22)
- test(server): unit test hashing password dan token JWT dengan Jest (PR #23)

### Perawatan (chore)
- chore(ci): workflow GitHub Actions untuk lint dan test pada frontend dan backend
- chore(ci): menonaktifkan sementara langkah test, lalu mengaktifkannya kembali (PR #19, PR #25)
- chore(server): konfigurasi ESLint dan perbaikan temuan lint (PR #20)
- chore(client): script `lint:fix` (PR #21)

### Dokumentasi (docs)
- docs: template review PR, `docs/ci_architecture.md`, `docs/test_matrix.md`, `docs/secrets_reference.md`
- docs: `docs/api_specifications.md` dan `docs/schema.sql`

### Refaktor (refactor)
- refactor(server): memindahkan fungsi hashing dan JWT ke `server/src/utils/auth.js`

Nomor PR yang masih berupa `[34]` diisi dari tab Pull requests sebelum dokumen ini dikumpulkan.