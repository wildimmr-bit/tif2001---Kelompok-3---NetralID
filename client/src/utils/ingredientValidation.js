import { isKnownUnit } from './units'

// Seperti validation.js: mengembalikan string kosong bila valid, atau pesan galat.

export const validateIngredientName = (name) => {
  if (!name.trim()) return 'Nama bahan wajib diisi'
  if (name.trim().length > 100) return 'Nama bahan maksimal 100 karakter'
  return ''
}

export const validateIngredientUnit = (unit) => {
  if (!isKnownUnit(unit)) return 'Satuan wajib dipilih'
  return ''
}

// Jumlah boleh berupa desimal dengan koma atau titik (contoh: 0,5).
export const parseQty = (value) => {
  const text = String(value).trim().replace(',', '.')
  if (!/^\d+(\.\d+)?$/.test(text)) return NaN
  return Number(text)
}

export const validateIngredientQty = (value) => {
  if (!String(value).trim()) return 'Jumlah beli wajib diisi'
  const qty = parseQty(value)
  if (Number.isNaN(qty)) return 'Jumlah beli harus berupa angka'
  if (qty <= 0) return 'Jumlah beli harus lebih dari 0'
  if (qty >= 1e9) return 'Jumlah beli terlalu besar'
  return ''
}

// Harga hanya boleh angka bulat tanpa titik atau koma, supaya "12.000" tidak terbaca sebagai 12.
export const validateIngredientPrice = (value) => {
  const text = String(value).trim()
  if (!text) return 'Harga beli wajib diisi'
  if (!/^\d+$/.test(text)) return 'Harga diisi angka saja, tanpa titik atau koma'
  if (Number(text) >= 1e12) return 'Harga beli terlalu besar'
  return ''
}