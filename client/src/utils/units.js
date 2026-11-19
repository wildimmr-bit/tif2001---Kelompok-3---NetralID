// Salinan aturan konversi satuan dari server, hanya untuk pratinjau di formulir.
// Hasil resmi tetap dihitung oleh server.
export const UNITS = {
  kg: { type: 'weight', base: 'gram', factor: 1000 },
  gram: { type: 'weight', base: 'gram', factor: 1 },
  ons: { type: 'weight', base: 'gram', factor: 100 },
  liter: { type: 'volume', base: 'ml', factor: 1000 },
  ml: { type: 'volume', base: 'ml', factor: 1 },
  butir: { type: 'count', base: 'butir', factor: 1 },
}

// Pengelompokan untuk pilihan satuan di formulir.
export const UNIT_GROUPS = [
  { label: 'Berat', units: ['kg', 'gram', 'ons'] },
  { label: 'Volume', units: ['liter', 'ml'] },
  { label: 'Jumlah', units: ['butir'] },
]

export const isKnownUnit = (unit) => Object.hasOwn(UNITS, unit)

export const getBaseUnit = (unit) => (isKnownUnit(unit) ? UNITS[unit].base : '')

// Harga per satuan dasar. Mengembalikan null bila isian belum valid.
export const pricePerBase = (price, qty, unit) => {
  if (!isKnownUnit(unit)) return null
  if (!Number.isFinite(price) || price < 0) return null
  if (!Number.isFinite(qty) || qty <= 0) return null
  return price / (qty * UNITS[unit].factor)
}

const numberFormat = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 })

// Contoh: 12000 menjadi "Rp12.000", 1234.5 menjadi "Rp1.234,5".
export const formatRupiah = (value) => `Rp${numberFormat.format(value)}`

// Contoh: (1, 'kg') menjadi "1 kg = 1.000 gram". Satuan dasar ditampilkan apa adanya.
export const describeConversion = (qty, unit) => {
  if (!isKnownUnit(unit) || !Number.isFinite(qty) || qty <= 0) return ''
  const { base, factor } = UNITS[unit]
  return `${numberFormat.format(qty)} ${unit} = ${numberFormat.format(qty * factor)} ${base}`
}