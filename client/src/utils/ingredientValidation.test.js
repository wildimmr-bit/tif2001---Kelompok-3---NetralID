import { describe, it, expect } from 'vitest'
import {
  parseQty,
  validateIngredientName,
  validateIngredientPrice,
  validateIngredientQty,
  validateIngredientUnit,
} from './ingredientValidation'

describe('validateIngredientName', () => {
  it('menerima nama yang valid', () => {
    expect(validateIngredientName('Tepung terigu')).toBe('')
  })

  it('menolak nama kosong dan hanya spasi', () => {
    expect(validateIngredientName('')).toBe('Nama bahan wajib diisi')
    expect(validateIngredientName('   ')).toBe('Nama bahan wajib diisi')
  })

  it('menolak nama lebih dari 100 karakter, dan menerima tepat 100', () => {
    expect(validateIngredientName('a'.repeat(101))).toBe('Nama bahan maksimal 100 karakter')
    expect(validateIngredientName('a'.repeat(100))).toBe('')
  })
})

describe('validateIngredientUnit', () => {
  it('menerima satuan yang tersedia', () => {
    expect(validateIngredientUnit('kg')).toBe('')
    expect(validateIngredientUnit('butir')).toBe('')
  })

  it('menolak pilihan kosong dan satuan yang tidak dikenal', () => {
    expect(validateIngredientUnit('')).toBe('Satuan wajib dipilih')
    expect(validateIngredientUnit('sendok')).toBe('Satuan wajib dipilih')
  })
})

describe('parseQty', () => {
  it('membaca bilangan bulat dan desimal dengan titik atau koma', () => {
    expect(parseQty('1')).toBe(1)
    expect(parseQty('0,5')).toBe(0.5)
    expect(parseQty('0.5')).toBe(0.5)
    expect(parseQty(' 2 ')).toBe(2)
  })

  it('mengembalikan NaN untuk isian yang bukan angka', () => {
    expect(Number.isNaN(parseQty('abc'))).toBe(true)
    expect(Number.isNaN(parseQty('1,2,3'))).toBe(true)
    expect(Number.isNaN(parseQty('-1'))).toBe(true)
    expect(Number.isNaN(parseQty(''))).toBe(true)
  })
})

describe('validateIngredientQty', () => {
  it('menerima jumlah yang valid', () => {
    expect(validateIngredientQty('1')).toBe('')
    expect(validateIngredientQty('0,5')).toBe('')
  })

  it('menolak kosong, bukan angka, dan nol', () => {
    expect(validateIngredientQty('')).toBe('Jumlah beli wajib diisi')
    expect(validateIngredientQty('abc')).toBe('Jumlah beli harus berupa angka')
    expect(validateIngredientQty('0')).toBe('Jumlah beli harus lebih dari 0')
  })

  it('menolak jumlah yang terlalu besar', () => {
    expect(validateIngredientQty('1000000000')).toBe('Jumlah beli terlalu besar')
  })
})

describe('validateIngredientPrice', () => {
  it('menerima angka bulat, termasuk 0', () => {
    expect(validateIngredientPrice('12000')).toBe('')
    expect(validateIngredientPrice('0')).toBe('')
  })

  it('menolak kosong', () => {
    expect(validateIngredientPrice('')).toBe('Harga beli wajib diisi')
    expect(validateIngredientPrice('   ')).toBe('Harga beli wajib diisi')
  })

  it('menolak titik, koma, huruf, dan nilai negatif agar "12.000" tidak terbaca sebagai 12', () => {
    const message = 'Harga diisi angka saja, tanpa titik atau koma'
    expect(validateIngredientPrice('12.000')).toBe(message)
    expect(validateIngredientPrice('12,5')).toBe(message)
    expect(validateIngredientPrice('Rp12000')).toBe(message)
    expect(validateIngredientPrice('-5')).toBe(message)
  })

  it('menolak harga yang terlalu besar', () => {
    expect(validateIngredientPrice('1000000000000')).toBe('Harga beli terlalu besar')
  })
})