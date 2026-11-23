import { describe, it, expect } from 'vitest'
import {
  UNITS,
  UNIT_GROUPS,
  describeConversion,
  formatRupiah,
  getBaseUnit,
  isKnownUnit,
  pricePerBase,
} from './units'

describe('isKnownUnit dan getBaseUnit', () => {
  it('mengenali keenam satuan', () => {
    ;['kg', 'gram', 'ons', 'liter', 'ml', 'butir'].forEach((unit) => {
      expect(isKnownUnit(unit)).toBe(true)
    })
  })

  it('menolak satuan lain, termasuk nama bawaan objek', () => {
    expect(isKnownUnit('sendok')).toBe(false)
    expect(isKnownUnit('constructor')).toBe(false)
    expect(isKnownUnit(undefined)).toBe(false)
  })

  it('memberi satuan dasar yang benar', () => {
    expect(getBaseUnit('kg')).toBe('gram')
    expect(getBaseUnit('ons')).toBe('gram')
    expect(getBaseUnit('liter')).toBe('ml')
    expect(getBaseUnit('butir')).toBe('butir')
    expect(getBaseUnit('xyz')).toBe('')
  })

  it('pengelompokan memuat semua satuan tepat satu kali', () => {
    const grouped = UNIT_GROUPS.flatMap((group) => group.units).sort()
    expect(grouped).toEqual(Object.keys(UNITS).sort())
  })
})

describe('pricePerBase', () => {
  it('tepung 1 kg Rp12.000 menjadi Rp12 per gram', () => {
    expect(pricePerBase(12000, 1, 'kg')).toBe(12)
  })

  it('minyak 2 liter Rp36.000 menjadi Rp18 per ml', () => {
    expect(pricePerBase(36000, 2, 'liter')).toBe(18)
  })

  it('telur 10 butir Rp28.000 menjadi Rp2.800 per butir', () => {
    expect(pricePerBase(28000, 10, 'butir')).toBe(2800)
  })

  it('gula 1 ons Rp1.500 menjadi Rp15 per gram', () => {
    expect(pricePerBase(1500, 1, 'ons')).toBe(15)
  })

  it('menerima jumlah desimal', () => {
    expect(pricePerBase(6000, 0.5, 'kg')).toBe(12)
  })

  it('mengembalikan null untuk isian yang belum valid', () => {
    expect(pricePerBase(12000, 0, 'kg')).toBeNull()
    expect(pricePerBase(12000, -1, 'kg')).toBeNull()
    expect(pricePerBase(-1, 1, 'kg')).toBeNull()
    expect(pricePerBase(12000, 1, 'sendok')).toBeNull()
    expect(pricePerBase(NaN, 1, 'kg')).toBeNull()
  })
})

describe('formatRupiah', () => {
  it('memakai titik sebagai pemisah ribuan', () => {
    expect(formatRupiah(12000)).toBe('Rp12.000')
    expect(formatRupiah(1500000)).toBe('Rp1.500.000')
    expect(formatRupiah(0)).toBe('Rp0')
  })

  it('memakai koma untuk desimal, maksimal dua angka', () => {
    expect(formatRupiah(1234.5)).toBe('Rp1.234,5')
    expect(formatRupiah(0.123456)).toBe('Rp0,12')
  })
})

describe('describeConversion', () => {
  it('menjelaskan konversi ke satuan dasar', () => {
    expect(describeConversion(1, 'kg')).toBe('1 kg = 1.000 gram')
    expect(describeConversion(2, 'liter')).toBe('2 liter = 2.000 ml')
    expect(describeConversion(0.5, 'kg')).toBe('0,5 kg = 500 gram')
    expect(describeConversion(10, 'butir')).toBe('10 butir = 10 butir')
  })

  it('mengembalikan teks kosong bila isian belum valid', () => {
    expect(describeConversion(0, 'kg')).toBe('')
    expect(describeConversion(1, 'sendok')).toBe('')
    expect(describeConversion(NaN, 'kg')).toBe('')
  })
})