const { parseListQuery, escapeLike, DEFAULT_LIMIT, MAX_LIMIT } = require('../src/utils/pagination')

describe('parseListQuery', () => {
  it('memakai nilai bawaan bila tidak ada parameter', () => {
    const { errors, query } = parseListQuery({})
    expect(errors).toBeNull()
    expect(query).toEqual({ search: '', page: 1, limit: DEFAULT_LIMIT, categoryIds: [] })
  })

  it('tidak error saat query kosong atau tidak ada', () => {
    expect(parseListQuery(undefined).errors).toBeNull()
    expect(parseListQuery(null).errors).toBeNull()
  })

  it('membaca search, page, limit, dan category', () => {
    const { query } = parseListQuery({ search: '  batik ', page: '2', limit: '25', category: '1,3' })
    expect(query).toEqual({ search: 'batik', page: 2, limit: 25, categoryIds: [1, 3] })
  })

  it('menerima limit tepat di batas atas dan bawah', () => {
    expect(parseListQuery({ limit: '1' }).query.limit).toBe(1)
    expect(parseListQuery({ limit: String(MAX_LIMIT) }).query.limit).toBe(MAX_LIMIT)
  })

  it('menolak limit 0 dan di atas batas', () => {
    expect(parseListQuery({ limit: '0' }).errors.limit).toBeDefined()
    expect(parseListQuery({ limit: String(MAX_LIMIT + 1) }).errors.limit).toBeDefined()
  })

  it('menolak halaman 0, negatif, desimal, dan bukan angka', () => {
    ;['0', '-1', '1.5', 'abc', ''].forEach((page) => {
      expect(parseListQuery({ page }).errors.page).toBeDefined()
    })
  })

  it('menghapus id kategori yang kembar', () => {
    expect(parseListQuery({ category: '2,2,3' }).query.categoryIds).toEqual([2, 3])
  })

  it('menolak kategori yang bukan daftar angka positif, atau lebih dari 10', () => {
    ;['abc', '1,x', '0', '-1', '1;DROP TABLE users', '1,,2', '99999999999'].forEach((category) => {
      expect(parseListQuery({ category }).errors.category).toBeDefined()
    })
    const sebelas = Array.from({ length: 11 }, (_, i) => i + 1).join(',')
    expect(parseListQuery({ category: sebelas }).errors.category).toBeDefined()
  })

  it('kategori kosong dianggap tanpa filter', () => {
    expect(parseListQuery({ category: '' }).query.categoryIds).toEqual([])
  })

  it('menolak kata kunci lebih dari 100 karakter, dan menerima tepat 100', () => {
    expect(parseListQuery({ search: 'a'.repeat(101) }).errors.search).toBeDefined()
    expect(parseListQuery({ search: 'a'.repeat(100) }).errors).toBeNull()
  })

  it('menolak parameter berulang (array) agar tidak ditafsirkan salah', () => {
    expect(parseListQuery({ search: ['a', 'b'] }).errors.search).toBeDefined()
    expect(parseListQuery({ page: ['1', '2'] }).errors.page).toBeDefined()
  })
})

describe('escapeLike', () => {
  it('mengamankan %, _, dan garis miring terbalik', () => {
    expect(escapeLike('100%')).toBe('100\\%')
    expect(escapeLike('a_b')).toBe('a\\_b')
    expect(escapeLike('a\\b')).toBe('a\\\\b')
  })

  it('tidak mengubah teks biasa', () => {
    expect(escapeLike('tepung terigu')).toBe('tepung terigu')
  })
})