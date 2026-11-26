const pool = require('../config/db');

// GET /api/v1/categories
const list = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name FROM categories ORDER BY name');
    return res.status(200).json({ message: 'Daftar kategori', data: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

module.exports = { list };