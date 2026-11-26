const { UNITS } = require('./units');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isUuid = (value) => typeof value === 'string' && UUID_PATTERN.test(value);

// Menerima angka atau teks angka (misalnya "12000"). Selain itu dianggap tidak valid.
const toNumber = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return NaN;
};

// Memeriksa isi request untuk tambah dan ubah bahan.
// Mengembalikan { errors, data }. Jika errors kosong, data sudah dirapikan.
const validateIngredientInput = (body) => {
  const errors = {};
  const source = body || {};

  const name = typeof source.name === 'string' ? source.name.trim() : '';
  if (!name) {
    errors.name = 'Nama bahan wajib diisi';
  } else if (name.length > 100) {
    errors.name = 'Nama bahan maksimal 100 karakter';
  }

  const unit = source.purchase_unit;
  if (typeof unit !== 'string' || !Object.prototype.hasOwnProperty.call(UNITS, unit)) {
    errors.purchase_unit = 'Satuan harus salah satu dari: kg, gram, ons, liter, ml, butir';
  }

  const qty = toNumber(source.purchase_qty);
  if (!Number.isFinite(qty) || qty <= 0) {
    errors.purchase_qty = 'Jumlah beli harus lebih dari 0';
  } else if (qty >= 1e9) {
    errors.purchase_qty = 'Jumlah beli terlalu besar';
  }

  const price = toNumber(source.purchase_price);
  if (!Number.isFinite(price) || price < 0) {
    errors.purchase_price = 'Harga beli tidak boleh negatif';
  } else if (price >= 1e12) {
    errors.purchase_price = 'Harga beli terlalu besar';
  }

  // Kategori boleh kosong. Bila diisi harus berupa id bilangan bulat positif.
  let categoryId = null;
  const rawCategory = source.category_id;
  if (rawCategory !== undefined && rawCategory !== null && rawCategory !== '') {
    const parsed = toNumber(rawCategory);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 2147483647) {
      errors.category_id = 'Kategori tidak valid';
    } else {
      categoryId = parsed;
    }
  }

  return {
    errors,
    data: {
      name,
      purchase_unit: unit,
      purchase_qty: qty,
      purchase_price: price,
      category_id: categoryId,
    },
  };
};

module.exports = { validateIngredientInput, isUuid };