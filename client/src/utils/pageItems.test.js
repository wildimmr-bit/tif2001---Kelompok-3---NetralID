import { describe, it, expect } from 'vitest'
import { buildPageItems } from './pageItems'

describe('buildPageItems', () => {
  it('menampilkan semua halaman bila jumlahnya sedikit', () => {
    expect(buildPageItems(1, 1)).toEqual([1])
    expect(buildPageItems(2, 5)).toEqual([1, 2, 3, 4, 5])
    expect(buildPageItems(7, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('di awal daftar: halaman 1 sampai 4, jeda, lalu halaman terakhir', () => {
    expect(buildPageItems(1, 20)).toEqual([1, 2, 3, 4, '…', 20])
  })

  it('di tengah daftar: halaman pertama, jeda, tetangga halaman aktif, jeda, halaman terakhir', () => {
    expect(buildPageItems(10, 20)).toEqual([1, '…', 9, 10, 11, '…', 20])
  })

  it('di akhir daftar: halaman pertama, jeda, lalu empat halaman terakhir', () => {
    expect(buildPageItems(20, 20)).toEqual([1, '…', 17, 18, 19, 20])
  })

  it('satu halaman yang terlewat ditampilkan, bukan diganti tanda jeda', () => {
    expect(buildPageItems(4, 10)).toEqual([1, 2, 3, 4, 5, '…', 10])
    expect(buildPageItems(7, 10)).toEqual([1, '…', 6, 7, 8, 9, 10])
  })

  it('halaman aktif selalu ada, dan tidak ada nomor ganda atau di luar jangkauan', () => {
    for (let total = 1; total <= 30; total += 1) {
      for (let current = 1; current <= total; current += 1) {
        const items = buildPageItems(current, total)
        const numbers = items.filter((item) => item !== '…')
        expect(numbers).toContain(current)
        expect(numbers).toContain(1)
        expect(numbers).toContain(total)
        expect(new Set(numbers).size).toBe(numbers.length)
        expect(numbers.every((n) => n >= 1 && n <= total)).toBe(true)
        expect(numbers).toEqual([...numbers].sort((a, b) => a - b))
      }
    }
  })

  it('tidak pernah menaruh jeda di antara dua nomor yang berurutan', () => {
    for (let total = 8; total <= 30; total += 1) {
      for (let current = 1; current <= total; current += 1) {
        const items = buildPageItems(current, total)
        items.forEach((item, index) => {
          if (item === '…') {
            expect(items[index + 1] - items[index - 1]).toBeGreaterThan(2)
          }
        })
      }
    }
  })
})