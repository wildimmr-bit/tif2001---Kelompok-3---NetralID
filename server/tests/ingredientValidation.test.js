const { validateIngredientInput, isUuid } = require('../src/utils/ingredientValidation')

const valid = { name: 'Tepung terigu', purchase_unit: 'kg', purchase_qty: 1, purchase_price: 12000 }

describe('validateIngredientInput', () => {
  it('menerima data yang benar dan merapikannya', () => {
    const { errors, data } = validateIngredientInput({ ...valid, name: '  Tepung terigu  ' })
    expect(errors).toEqual({})
    expect(data).toEqual({ ...valid, category_id: null })
  })

  it('menerima angka dalam bentuk teks', () => {
    const { errors, data } = validateIngredientInput({ ...valid, purchase_qty: '2', purchase_price: '24000' })
    expect(errors).toEqual({})
    expect(data.purchase_qty).toBe(2)
    expect(data.purchase_price).toBe(24000)
  })

  it('menerima harga 0', () => {
    expect(validateIngredientInput({ ...valid, purchase_price: 0 }).errors).toEqual({})
  })

  it('menolak nama kosong atau hanya spasi', () => {
    expect(validateIngredientInput({ ...valid, name: '' }).errors.name).toBeDefined()
    expect(validateIngredientInput({ ...valid, name: '   ' }).errors.name).toBeDefined()
  })

  it('menolak nama lebih dari 100 karakter, dan menerima tepat 100', () => {
    expect(validateIngredientInput({ ...valid, name: 'a'.repeat(101) }).errors.name).toBeDefined()
    expect(validateIngredientInput({ ...valid, name: 'a'.repeat(100) }).errors.name).toBeUndefined()
  })

  it('menolak satuan yang tidak dikenal, termasuk nama bawaan objek', () => {
    expect(validateIngredientInput({ ...valid, purchase_unit: 'sendok' }).errors.purchase_unit).toBeDefined()
    expect(validateIngredientInput({ ...valid, purchase_unit: 'constructor' }).errors.purchase_unit).toBeDefined()
    expect(validateIngredientInput({ ...valid, purchase_unit: undefined }).errors.purchase_unit).toBeDefined()
  })

  it('menerima keenam satuan', () => {
    ;['kg', 'gram', 'ons', 'liter', 'ml', 'butir'].forEach((unit) => {
      expect(validateIngredientInput({ ...valid, purchase_unit: unit }).errors).toEqual({})
    })
  })

  it('menolak jumlah beli 0, negatif, kosong, atau bukan angka', () => {
    ;[0, -1, '', 'abc', null, undefined].forEach((qty) => {
      expect(validateIngredientInput({ ...valid, purchase_qty: qty }).errors.purchase_qty).toBeDefined()
    })
  })

  it('menolak harga negatif atau bukan angka', () => {
    ;[-1, '', 'abc', null].forEach((price) => {
      expect(validateIngredientInput({ ...valid, purchase_price: price }).errors.purchase_price).toBeDefined()
    })
  })

  it('menolak angka yang terlalu besar untuk kolom database', () => {
    expect(validateIngredientInput({ ...valid, purchase_qty: 1e9 }).errors.purchase_qty).toBeDefined()
    expect(validateIngredientInput({ ...valid, purchase_price: 1e12 }).errors.purchase_price).toBeDefined()
  })

  it('kategori boleh kosong, dan terbaca sebagai null', () => {
    ;[undefined, null, ''].forEach((category_id) => {
      const { errors, data } = validateIngredientInput({ ...valid, category_id })
      expect(errors).toEqual({})
      expect(data.category_id).toBeNull()
    })
  })

  it('menerima id kategori berupa angka atau teks angka', () => {
    expect(validateIngredientInput({ ...valid, category_id: 3 }).data.category_id).toBe(3)
    expect(validateIngredientInput({ ...valid, category_id: '3' }).data.category_id).toBe(3)
  })

  it('menolak id kategori nol, negatif, desimal, bukan angka, dan terlalu besar', () => {
    ;[0, -1, 1.5, 'abc', 99999999999].forEach((category_id) => {
      expect(validateIngredientInput({ ...valid, category_id }).errors.category_id).toBeDefined()
    })
  })

  it('tidak error saat body kosong, dan melaporkan semua isian wajib', () => {
    const { errors } = validateIngredientInput(undefined)
    expect(Object.keys(errors).sort()).toEqual(['name', 'purchase_price', 'purchase_qty', 'purchase_unit'])
  })
})

describe('isUuid', () => {
  it('menerima UUID yang benar', () => {
    expect(isUuid('3f2b8c1e-5a4d-4b7e-9c10-1a2b3c4d5e6f')).toBe(true)
  })

  it('menolak teks yang bukan UUID', () => {
    ;['123', 'abc', '', undefined, null, 42].forEach((value) => {
      expect(isUuid(value)).toBe(false)
    })
  })
})