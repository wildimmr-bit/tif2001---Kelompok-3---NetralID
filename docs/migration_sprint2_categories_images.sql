-- Migrasi Sprint 2: kategori bahan dan gambar bahan
-- Aman dijalankan berulang kali (idempotent). Tidak menghapus data apa pun.
-- Jalankan setelah database_schema.sql (tabel users, ingredients, ingredient_price_history).

-- 1. Tabel kategori
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);

-- 2. Delapan kategori awal (DRAF: sesuaikan dengan kesepakatan tim)
INSERT INTO categories (name) VALUES
  ('Daging & Unggas'),
  ('Ikan & Seafood'),
  ('Sayuran'),
  ('Buah'),
  ('Susu, Telur & Olahan'),
  ('Bumbu & Rempah'),
  ('Beras, Tepung & Bahan Kering'),
  ('Lainnya')
ON CONFLICT (name) DO NOTHING;

-- 3. Kolom baru pada tabel ingredients
ALTER TABLE ingredients
  ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL;

ALTER TABLE ingredients
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 4. Indeks untuk filter berdasarkan kategori
CREATE INDEX IF NOT EXISTS idx_ingredients_category_id ON ingredients(category_id);
