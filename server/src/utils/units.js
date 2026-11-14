// Tabel satuan: jenis, satuan dasar, dan faktor konversi ke satuan dasar.
const UNITS = {
  kg: { type: 'weight', base: 'gram', factor: 1000 },
  gram: { type: 'weight', base: 'gram', factor: 1 },
  ons: { type: 'weight', base: 'gram', factor: 100 },
  liter: { type: 'volume', base: 'ml', factor: 1000 },
  ml: { type: 'volume', base: 'ml', factor: 1 },
  butir: { type: 'count', base: 'butir', factor: 1 },
};

const getUnit = (unit) => {
  const info = UNITS[unit];
  if (!info) throw new Error('Satuan tidak dikenal');
  return info;
};

const assertPositive = (value, message) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new Error(message);
  }
};

// Mengubah jumlah ke satuan dasar. Contoh: 2 kg menjadi 2000 gram.
const toBase = (qty, unit) => {
  assertPositive(qty, 'Jumlah harus lebih dari 0');
  return qty * getUnit(unit).factor;
};

// Harga per satuan dasar dari harga beli. Contoh: Rp12.000 per 1 kg menjadi Rp12 per gram.
const pricePerBase = (price, qty, unit) => {
  if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) {
    throw new Error('Harga tidak boleh negatif');
  }
  return price / toBase(qty, unit);
};

// Biaya bahan dalam resep. Takaran harus sejenis dengan bahan (berat, volume, atau jumlah).
const recipeCost = (ingredient, qty, unit) => {
  const ingredientType = getUnit(ingredient.unit).type;
  if (getUnit(unit).type !== ingredientType) {
    throw new Error('Satuan takaran tidak sejenis dengan bahan');
  }
  return toBase(qty, unit) * ingredient.pricePerBase;
};

module.exports = { UNITS, toBase, pricePerBase, recipeCost };