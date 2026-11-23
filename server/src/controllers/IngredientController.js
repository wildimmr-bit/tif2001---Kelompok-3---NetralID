const pool = require('../config/db');
const { pricePerBase } = require('../utils/units');
const { validateIngredientInput, isUuid } = require('../utils/ingredientValidation');

const COLUMNS =
  'id, name, purchase_unit, purchase_qty, purchase_price, price_per_base, created_at, updated_at';

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

// GET /api/v1/ingredients
const list = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ${COLUMNS} FROM ingredients WHERE user_id = $1 ORDER BY lower(name)`,
      [req.user.id]
    );
    return res.status(200).json({ message: 'Daftar bahan', data: result.rows.map(toIngredient) });
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
      `INSERT INTO ingredients (user_id, name, purchase_unit, purchase_qty, purchase_price, price_per_base)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${COLUMNS}`,
      [req.user.id, data.name, data.purchase_unit, data.purchase_qty, data.purchase_price, perBase]
    );
    const row = inserted.rows[0];
    await client.query(
      `INSERT INTO ingredient_price_history
         (ingredient_id, purchase_unit, purchase_qty, purchase_price, price_per_base)
       VALUES ($1, $2, $3, $4, $5)`,
      [row.id, data.purchase_unit, data.purchase_qty, data.purchase_price, perBase]
    );
    await client.query('COMMIT');
    return res.status(201).json({ message: 'Bahan berhasil ditambahkan', data: toIngredient(row) });
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Nama bahan sudah ada' });
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
      `SELECT ${COLUMNS} FROM ingredients WHERE id = $1 AND user_id = $2 FOR UPDATE`,
      [req.params.id, req.user.id]
    );
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return notFound(res);
    }
    const before = existing.rows[0];

    const updated = await client.query(
      `UPDATE ingredients
          SET name = $1, purchase_unit = $2, purchase_qty = $3, purchase_price = $4,
              price_per_base = $5, updated_at = NOW()
        WHERE id = $6 AND user_id = $7
        RETURNING ${COLUMNS}`,
      [
        data.name,
        data.purchase_unit,
        data.purchase_qty,
        data.purchase_price,
        perBase,
        req.params.id,
        req.user.id,
      ]
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

    await client.query('COMMIT');
    return res
      .status(200)
      .json({ message: 'Bahan berhasil diperbarui', data: toIngredient(updated.rows[0]) });
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Nama bahan sudah ada' });
    }
    return serverError(res, err);
  } finally {
    if (client) client.release();
  }
};

// DELETE /api/v1/ingredients/:id
const remove = async (req, res) => {
  if (!isUuid(req.params.id)) return notFound(res);
  try {
    const result = await pool.query(
      'DELETE FROM ingredients WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return notFound(res);
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

module.exports = { list, create, update, remove, history };