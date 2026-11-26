const pool = require('../config/db');
const { pricePerBase } = require('../utils/units');
const { validateIngredientInput, isUuid } = require('../utils/ingredientValidation');
const { parseListQuery, escapeLike } = require('../utils/pagination');
const { detectImageType, EXTENSIONS } = require('../utils/imageSignature');
const storage = require('../services/storage');

const SELECT_FIELDS = `i.id, i.name, i.purchase_unit, i.purchase_qty, i.purchase_price,
  i.price_per_base, i.category_id, c.name AS category_name, i.image_url, i.created_at, i.updated_at`;
const FROM_JOIN = 'FROM ingredients i LEFT JOIN categories c ON c.id = i.category_id';

// Driver pg mengembalikan kolom NUMERIC sebagai teks, jadi diubah ke angka agar mudah dipakai frontend.
const toIngredient = (row) => ({
  ...row,
  purchase_qty: Number(row.purchase_qty),
  purchase_price: Number(row.purchase_price),
  price_per_base: Number(row.price_per_base),
});

const serverError = (res, err) => {
  console.error(err);
  return res.status(500).json({ message: 'Terjadi kesalahan pada server' });
};

const notFound = (res) => res.status(404).json({ message: 'Bahan tidak ditemukan' });

// Membaca satu bahan milik pengguna lengkap dengan nama kategorinya.
const fetchOne = async (db, id, userId) => {
  const result = await db.query(
    `SELECT ${SELECT_FIELDS} ${FROM_JOIN} WHERE i.id = $1 AND i.user_id = $2`,
    [id, userId]
  );
  return result.rows[0] ? toIngredient(result.rows[0]) : null;
};

// GET /api/v1/ingredients?search=&category=1,3&page=1&limit=10
const list = async (req, res) => {
  const { errors, query } = parseListQuery(req.query);
  if (errors) return res.status(400).json({ message: 'Parameter tidak valid', errors });

  const conditions = ['i.user_id = $1'];
  const params = [req.user.id];
  if (query.search) {
    params.push(`%${escapeLike(query.search)}%`);
    conditions.push(`i.name ILIKE $${params.length} ESCAPE '\\'`);
  }
  if (query.categoryIds.length > 0) {
    params.push(query.categoryIds);
    conditions.push(`i.category_id = ANY($${params.length}::int[])`);
  }
  const where = conditions.join(' AND ');
  const offset = (query.page - 1) * query.limit;

  try {
    const count = await pool.query(`SELECT count(*)::int AS total FROM ingredients i WHERE ${where}`, params);
    const rows = await pool.query(
      `SELECT ${SELECT_FIELDS} ${FROM_JOIN} WHERE ${where}
        ORDER BY lower(i.name), i.id
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, query.limit, offset]
    );

    const totalRows = count.rows[0].total;
    return res.status(200).json({
      message: 'Daftar bahan',
      data: rows.rows.map(toIngredient),
      meta: {
        totalRows,
        totalPages: Math.max(1, Math.ceil(totalRows / query.limit)),
        currentPage: query.page,
        limit: query.limit,
      },
    });
  } catch (err) {
    return serverError(res, err);
  }
};

// POST /api/v1/ingredients
const create = async (req, res) => {
  const { errors, data } = validateIngredientInput(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Data tidak valid', errors });
  }

  const perBase = pricePerBase(data.purchase_price, data.purchase_qty, data.purchase_unit);
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const inserted = await client.query(
      `INSERT INTO ingredients
         (user_id, name, purchase_unit, purchase_qty, purchase_price, price_per_base, category_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [req.user.id, data.name, data.purchase_unit, data.purchase_qty, data.purchase_price, perBase, data.category_id]
    );
    const id = inserted.rows[0].id;
    await client.query(
      `INSERT INTO ingredient_price_history
         (ingredient_id, purchase_unit, purchase_qty, purchase_price, price_per_base)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, data.purchase_unit, data.purchase_qty, data.purchase_price, perBase]
    );
    const row = await fetchOne(client, id, req.user.id);
    await client.query('COMMIT');
    return res.status(201).json({ message: 'Bahan berhasil ditambahkan', data: row });
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    if (err.code === '23505') return res.status(409).json({ message: 'Nama bahan sudah ada' });
    if (err.code === '23503') {
      return res.status(400).json({ message: 'Data tidak valid', errors: { category_id: 'Kategori tidak ditemukan' } });
    }
    return serverError(res, err);
  } finally {
    if (client) client.release();
  }
};

// PUT /api/v1/ingredients/:id
const update = async (req, res) => {
  if (!isUuid(req.params.id)) return notFound(res);

  const { errors, data } = validateIngredientInput(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Data tidak valid', errors });
  }

  const perBase = pricePerBase(data.purchase_price, data.purchase_qty, data.purchase_unit);
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const existing = await client.query(
      `SELECT purchase_unit, purchase_qty, purchase_price
         FROM ingredients WHERE id = $1 AND user_id = $2 FOR UPDATE`,
      [req.params.id, req.user.id]
    );
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return notFound(res);
    }
    const before = existing.rows[0];

    await client.query(
      `UPDATE ingredients
          SET name = $1, purchase_unit = $2, purchase_qty = $3, purchase_price = $4,
              price_per_base = $5, category_id = $6, updated_at = NOW()
        WHERE id = $7 AND user_id = $8`,
      [data.name, data.purchase_unit, data.purchase_qty, data.purchase_price, perBase, data.category_id, req.params.id, req.user.id]
    );

    const priceChanged =
      before.purchase_unit !== data.purchase_unit ||
      Number(before.purchase_qty) !== data.purchase_qty ||
      Number(before.purchase_price) !== data.purchase_price;
    if (priceChanged) {
      await client.query(
        `INSERT INTO ingredient_price_history
           (ingredient_id, purchase_unit, purchase_qty, purchase_price, price_per_base)
         VALUES ($1, $2, $3, $4, $5)`,
        [req.params.id, data.purchase_unit, data.purchase_qty, data.purchase_price, perBase]
      );
    }

    const row = await fetchOne(client, req.params.id, req.user.id);
    await client.query('COMMIT');
    return res.status(200).json({ message: 'Bahan berhasil diperbarui', data: row });
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    if (err.code === '23505') return res.status(409).json({ message: 'Nama bahan sudah ada' });
    if (err.code === '23503') {
      return res.status(400).json({ message: 'Data tidak valid', errors: { category_id: 'Kategori tidak ditemukan' } });
    }
    return serverError(res, err);
  } finally {
    if (client) client.release();
  }
};

// POST /api/v1/ingredients/:id/image  (multipart/form-data, kolom "image")
const uploadImage = async (req, res) => {
  if (!isUuid(req.params.id)) return notFound(res);

  try {
    const owned = await pool.query('SELECT image_url FROM ingredients WHERE id = $1 AND user_id = $2', [
      req.params.id,
      req.user.id,
    ]);
    if (owned.rows.length === 0) return notFound(res);
    const oldUrl = owned.rows[0].image_url;

    if (!req.file) {
      return res.status(400).json({ message: 'Berkas gambar wajib diunggah di kolom "image"' });
    }

    // Isi berkas harus benar-benar gambar, dan cocok dengan tipe yang dikirim klien.
    const realType = detectImageType(req.file.buffer);
    if (!realType || realType !== req.file.mimetype) {
      return res.status(400).json({ message: 'Isi berkas bukan gambar JPEG, PNG, atau WebP yang valid' });
    }

    const path = `${req.user.id}/${req.params.id}-${Date.now()}.${EXTENSIONS[realType]}`;
    const url = await storage.uploadImage({ buffer: req.file.buffer, contentType: realType, path });

    let updated;
    try {
      updated = await pool.query(
        'UPDATE ingredients SET image_url = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING id',
        [url, req.params.id, req.user.id]
      );
    } catch (dbError) {
      await storage.removeByUrl(url).catch(() => {});
      throw dbError;
    }
    if (updated.rows.length === 0) {
      await storage.removeByUrl(url).catch(() => {});
      return notFound(res);
    }

    // Gambar lama dibersihkan setelah yang baru tersimpan. Kegagalannya tidak menggagalkan permintaan.
    if (oldUrl) await storage.removeByUrl(oldUrl).catch((e) => console.error(e));

    const row = await fetchOne(pool, req.params.id, req.user.id);
    return res.status(200).json({ message: 'Gambar berhasil diunggah', data: row });
  } catch (err) {
    return serverError(res, err);
  }
};

// DELETE /api/v1/ingredients/:id
const remove = async (req, res) => {
  if (!isUuid(req.params.id)) return notFound(res);
  try {
    const result = await pool.query(
      'DELETE FROM ingredients WHERE id = $1 AND user_id = $2 RETURNING id, image_url',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return notFound(res);

    if (result.rows[0].image_url) {
      await storage.removeByUrl(result.rows[0].image_url).catch((e) => console.error(e));
    }
    return res.status(200).json({ message: 'Bahan berhasil dihapus' });
  } catch (err) {
    // Kode 23503: bahan masih dipakai tabel lain (misalnya resep, setelah tabel resep ada).
    if (err.code === '23503') {
      return res.status(409).json({ message: 'Bahan masih dipakai dalam resep' });
    }
    return serverError(res, err);
  }
};

// GET /api/v1/ingredients/:id/history
const history = async (req, res) => {
  if (!isUuid(req.params.id)) return notFound(res);
  try {
    const owned = await pool.query('SELECT id FROM ingredients WHERE id = $1 AND user_id = $2', [
      req.params.id,
      req.user.id,
    ]);
    if (owned.rows.length === 0) return notFound(res);

    const result = await pool.query(
      `SELECT id, purchase_unit, purchase_qty, purchase_price, price_per_base, recorded_at
         FROM ingredient_price_history
        WHERE ingredient_id = $1
        ORDER BY recorded_at DESC, id`,
      [req.params.id]
    );
    const rows = result.rows.map((row) => ({
      ...row,
      purchase_qty: Number(row.purchase_qty),
      purchase_price: Number(row.purchase_price),
      price_per_base: Number(row.price_per_base),
    }));
    return res.status(200).json({ message: 'Riwayat harga bahan', data: rows });
  } catch (err) {
    return serverError(res, err);
  }
};

module.exports = { list, create, update, uploadImage, remove, history };