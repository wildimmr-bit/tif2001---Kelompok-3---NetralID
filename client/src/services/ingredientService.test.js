import { describe, it, expect, beforeEach, vi } from 'vitest'

const { fakeApi } = vi.hoisted(() => ({ fakeApi: { request: vi.fn() } }))
vi.mock('./api', () => ({ default: fakeApi }))

import { listIngredients } from './ingredientService'

// Lingkungan uji ini berupa Node biasa (tanpa jsdom), jadi localStorage disediakan secara tiruan.
beforeEach(() => {
  fakeApi.request.mockReset()
  vi.stubGlobal('localStorage', { getItem: () => 'token-uji', setItem: () => {}, removeItem: () => {} })
})

describe('listIngredients', () => {
  it('tidak mengirim parameter yang kosong', async () => {
    fakeApi.request.mockResolvedValue({ data: { data: [], meta: { totalRows: 0, totalPages: 1, currentPage: 1, limit: 10 } } })
    await listIngredients({ search: '', category: '', page: 1, limit: 10 })
    expect(fakeApi.request.mock.calls[0][0].params).toEqual({ page: 1, limit: 10 })
  })

  it('mengirim token pada permintaan', async () => {
    fakeApi.request.mockResolvedValue({ data: { data: [], meta: { totalRows: 0, totalPages: 1, currentPage: 1, limit: 10 } } })
    await listIngredients()
    expect(fakeApi.request.mock.calls[0][0].headers).toEqual({ Authorization: 'Bearer token-uji' })
  })

  it('meneruskan meta dari server', async () => {
    const meta = { totalRows: 23, totalPages: 3, currentPage: 2, limit: 10 }
    fakeApi.request.mockResolvedValue({ data: { data: [{ id: 'a' }], meta } })
    const result = await listIngredients({ page: 2 })
    expect(result.meta).toEqual(meta)
    expect(result.items).toEqual([{ id: 'a' }])
  })

  it('server lama tanpa meta: dibuat satu halaman agar tidak error', async () => {
    fakeApi.request.mockResolvedValue({ data: { data: [{ id: 'a' }, { id: 'b' }] } })
    const { meta } = await listIngredients()
    expect(meta).toEqual({ totalRows: 2, totalPages: 1, currentPage: 1, limit: 2 })
  })
})