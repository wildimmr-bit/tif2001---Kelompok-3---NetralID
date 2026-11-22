jest.mock('../src/config/db', () => ({ query: jest.fn(), connect: jest.fn() }))

const pool = require('../src/config/db')
const controller = require('../src/controllers/ingredientController')

const USER_ID = '11111111-1111-4111-8111-111111111111'
const ITEM_ID = '22222222-2222-4222-8222-222222222222'
const validBody = { name: 'Tepung terigu', purchase_unit: 'kg', purchase_qty: 1, purchase_price: 12000 }

const makeRes = () => {
  const res = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

const makeClient = (responses = []) => {
  const client = { query: jest.fn(), release: jest.fn() }
  responses.forEach((response) => client.query.mockResolvedValueOnce(response))
  client.query.mockResolvedValue({ rows: [] })
  return client
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

describe('list', () => {
  it('hanya mengambil bahan milik pengguna yang login', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] })
    const res = makeRes()
    await controller.list({ user: { id: USER_ID } }, res)

    const [sql, params] = pool.query.mock.calls[0]
    expect(sql).toContain('WHERE user_id = $1')
    expect(params).toEqual([USER_ID])
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('mengubah kolom numerik dari teks ke angka', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: ITEM_ID, name: 'Tepung', purchase_qty: '1.000', purchase_price: '12000.00', price_per_base: '12.000000' }],
    })
    const res = makeRes()
    await controller.list({ user: { id: USER_ID } }, res)

    const item = res.json.mock.calls[0][0].data[0]
    expect(item.purchase_qty).toBe(1)
    expect(item.purchase_price).toBe(12000)
    expect(item.price_per_base).toBe(12)
  })

  it('mengembalikan 500 saat database gagal', async () => {
    pool.query.mockRejectedValueOnce(new Error('db down'))
    const res = makeRes()
    await controller.list({ user: { id: USER_ID } }, res)
    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('create', () => {
  it('menolak data tidak valid dengan 400 tanpa menyentuh database', async () => {
    const res = makeRes()
    await controller.create({ user: { id: USER_ID }, body: { name: '' } }, res)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(pool.connect).not.toHaveBeenCalled()
  })

  it('menyimpan bahan milik pengguna login, menghitung harga per satuan dasar, lalu commit', async () => {
    const row = { id: ITEM_ID, name: 'Tepung terigu', purchase_unit: 'kg', purchase_qty: '1', purchase_price: '12000', price_per_base: '12' }
    const client = makeClient([{ rows: [] }, { rows: [row] }])
    pool.connect.mockResolvedValueOnce(client)
    const res = makeRes()

    await controller.create({ user: { id: USER_ID }, body: validBody }, res)

    const calls = client.query.mock.calls
    expect(calls[0][0]).toBe('BEGIN')
    expect(calls[1][1]).toEqual([USER_ID, 'Tepung terigu', 'kg', 1, 12000, 12])
    expect(calls[2][1]).toEqual([ITEM_ID, 'kg', 1, 12000, 12])
    expect(calls[3][0]).toBe('COMMIT')
    expect(client.release).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(201)
  })

  it('mengembalikan 409 dan rollback bila nama sudah ada', async () => {
    const client = { query: jest.fn(), release: jest.fn() }
    client.query
      .mockResolvedValueOnce({ rows: [] })
      .mockRejectedValueOnce(Object.assign(new Error('duplikat'), { code: '23505' }))
      .mockResolvedValue({ rows: [] })
    pool.connect.mockResolvedValueOnce(client)
    const res = makeRes()

    await controller.create({ user: { id: USER_ID }, body: validBody }, res)

    expect(res.status).toHaveBeenCalledWith(409)
    expect(client.query.mock.calls.map((c) => c[0])).toContain('ROLLBACK')
    expect(client.release).toHaveBeenCalled()
  })

  it('mengembalikan 500 saat koneksi database gagal', async () => {
    pool.connect.mockRejectedValueOnce(new Error('tidak bisa konek'))
    const res = makeRes()
    await controller.create({ user: { id: USER_ID }, body: validBody }, res)
    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('update', () => {
  it('mengembalikan 404 untuk id yang bukan UUID tanpa menyentuh database', async () => {
    const res = makeRes()
    await controller.update({ user: { id: USER_ID }, params: { id: '123' }, body: validBody }, res)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(pool.connect).not.toHaveBeenCalled()
  })

  it('mengembalikan 404 bila bahan bukan milik pengguna', async () => {
    const client = makeClient([{ rows: [] }, { rows: [] }])
    pool.connect.mockResolvedValueOnce(client)
    const res = makeRes()

    await controller.update({ user: { id: USER_ID }, params: { id: ITEM_ID }, body: validBody }, res)

    const select = client.query.mock.calls[1]
    expect(select[0]).toContain('user_id = $2')
    expect(select[1]).toEqual([ITEM_ID, USER_ID])
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('menambah riwayat hanya bila harga atau jumlah berubah', async () => {
    const before = { id: ITEM_ID, purchase_unit: 'kg', purchase_qty: '1', purchase_price: '12000' }
    const after = { ...before, purchase_price: '15000', price_per_base: '15' }
    const client = makeClient([{ rows: [] }, { rows: [before] }, { rows: [after] }])
    pool.connect.mockResolvedValueOnce(client)
    const res = makeRes()

    await controller.update(
      { user: { id: USER_ID }, params: { id: ITEM_ID }, body: { ...validBody, purchase_price: 15000 } },
      res
    )

    const sqls = client.query.mock.calls.map((c) => c[0])
    expect(sqls.some((sql) => sql.includes('INSERT INTO ingredient_price_history'))).toBe(true)
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('tidak menambah riwayat bila hanya nama yang berubah', async () => {
    const before = { id: ITEM_ID, purchase_unit: 'kg', purchase_qty: '1', purchase_price: '12000' }
    const client = makeClient([{ rows: [] }, { rows: [before] }, { rows: [before] }])
    pool.connect.mockResolvedValueOnce(client)
    const res = makeRes()

    await controller.update(
      { user: { id: USER_ID }, params: { id: ITEM_ID }, body: { ...validBody, name: 'Tepung segitiga' } },
      res
    )

    const sqls = client.query.mock.calls.map((c) => c[0])
    expect(sqls.some((sql) => sql.includes('INSERT INTO ingredient_price_history'))).toBe(false)
  })
})

describe('remove', () => {
  it('menghapus hanya bahan milik pengguna login', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: ITEM_ID }] })
    const res = makeRes()
    await controller.remove({ user: { id: USER_ID }, params: { id: ITEM_ID } }, res)

    const [sql, params] = pool.query.mock.calls[0]
    expect(sql).toContain('user_id = $2')
    expect(params).toEqual([ITEM_ID, USER_ID])
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('mengembalikan 404 bila bahan tidak ditemukan', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] })
    const res = makeRes()
    await controller.remove({ user: { id: USER_ID }, params: { id: ITEM_ID } }, res)
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('mengembalikan 409 bila bahan masih dipakai tabel lain', async () => {
    pool.query.mockRejectedValueOnce(Object.assign(new Error('fk'), { code: '23503' }))
    const res = makeRes()
    await controller.remove({ user: { id: USER_ID }, params: { id: ITEM_ID } }, res)
    expect(res.status).toHaveBeenCalledWith(409)
  })
})

describe('history', () => {
  it('mengembalikan 404 bila bahan bukan milik pengguna, dan tidak membaca riwayat', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] })
    const res = makeRes()
    await controller.history({ user: { id: USER_ID }, params: { id: ITEM_ID } }, res)

    expect(pool.query).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(404)
  })
})