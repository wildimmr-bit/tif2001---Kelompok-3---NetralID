jest.mock('../src/config/db', () => ({ query: jest.fn(), connect: jest.fn() }))
jest.mock('../src/services/storage', () => ({
  uploadImage: jest.fn(),
  removeByUrl: jest.fn(),
}))

const pool = require('../src/config/db')
const storage = require('../src/services/storage')
const controller = require('../src/controllers/ingredientController')

const USER_ID = '11111111-1111-4111-8111-111111111111'
const ITEM_ID = '22222222-2222-4222-8222-222222222222'
const validBody = { name: 'Tepung terigu', purchase_unit: 'kg', purchase_qty: 1, purchase_price: 12000 }
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32)])

const makeRes = () => {
  const res = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

const row = (extra = {}) => ({
  id: ITEM_ID, name: 'Tepung', purchase_unit: 'kg', purchase_qty: '1.000', purchase_price: '12000.00',
  price_per_base: '12.000000', category_id: 1, category_name: 'Bahan pokok', image_url: null, ...extra,
})

const makeClient = (responses = []) => {
  const client = { query: jest.fn(), release: jest.fn() }
  responses.forEach((response) => client.query.mockResolvedValueOnce(response))
  client.query.mockResolvedValue({ rows: [] })
  return client
}

beforeEach(() => {
  jest.resetAllMocks()
  storage.removeByUrl.mockResolvedValue(undefined)
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

describe('list', () => {
  const req = (query = {}) => ({ user: { id: USER_ID }, query })

  it('menolak parameter tidak valid dengan 400 tanpa menyentuh database', async () => {
    const res = makeRes()
    await controller.list(req({ page: '0' }), res)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(pool.query).not.toHaveBeenCalled()
  })

  it('selalu menyaring berdasarkan pengguna yang login', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ total: 0 }] }).mockResolvedValueOnce({ rows: [] })
    await controller.list(req(), makeRes())
    const [sql, params] = pool.query.mock.calls[0]
    expect(sql).toContain('i.user_id = $1')
    expect(params[0]).toBe(USER_ID)
  })

  it('menghitung offset = (page - 1) x limit dan mengirim limit', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ total: 50 }] }).mockResolvedValueOnce({ rows: [] })
    await controller.list(req({ page: '3', limit: '5' }), makeRes())
    const [sql, params] = pool.query.mock.calls[1]
    expect(sql).toContain('LIMIT $2 OFFSET $3')
    expect(params).toEqual([USER_ID, 5, 10])
  })

  it('pencarian memakai ILIKE dengan karakter wildcard yang diamankan', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ total: 0 }] }).mockResolvedValueOnce({ rows: [] })
    await controller.list(req({ search: '100%' }), makeRes())
    const [sql, params] = pool.query.mock.calls[0]
    expect(sql).toContain('ILIKE $2')
    expect(params[1]).toBe('%100\\%%')
  })

  it('filter kategori memakai daftar id, bukan teks yang disisipkan ke SQL', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ total: 0 }] }).mockResolvedValueOnce({ rows: [] })
    await controller.list(req({ category: '1,3' }), makeRes())
    const [sql, params] = pool.query.mock.calls[0]
    expect(sql).toContain('i.category_id = ANY($2::int[])')
    expect(params[1]).toEqual([1, 3])
    expect(sql).not.toContain('1,3')
  })

  it('mengembalikan metadata paginasi dan mengubah kolom numerik ke angka', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ total: 23 }] }).mockResolvedValueOnce({ rows: [row()] })
    const res = makeRes()
    await controller.list(req({ page: '2', limit: '10' }), res)

    const body = res.json.mock.calls[0][0]
    expect(body.meta).toEqual({ totalRows: 23, totalPages: 3, currentPage: 2, limit: 10 })
    expect(body.data[0].purchase_qty).toBe(1)
    expect(body.data[0].purchase_price).toBe(12000)
    expect(body.data[0].price_per_base).toBe(12)
  })

  it('totalPages minimal 1 walau data kosong', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ total: 0 }] }).mockResolvedValueOnce({ rows: [] })
    const res = makeRes()
    await controller.list(req(), res)
    expect(res.json.mock.calls[0][0].meta.totalPages).toBe(1)
  })

  it('mengembalikan 500 saat database gagal', async () => {
    pool.query.mockRejectedValueOnce(new Error('db down'))
    const res = makeRes()
    await controller.list(req(), res)
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

  it('menyimpan bahan dengan kategori milik pengguna login, lalu commit', async () => {
    const client = makeClient([{ rows: [] }, { rows: [{ id: ITEM_ID }] }, { rows: [] }, { rows: [row()] }])
    pool.connect.mockResolvedValueOnce(client)
    const res = makeRes()

    await controller.create({ user: { id: USER_ID }, body: { ...validBody, category_id: 1 } }, res)

    const calls = client.query.mock.calls
    expect(calls[0][0]).toBe('BEGIN')
    expect(calls[1][1]).toEqual([USER_ID, 'Tepung terigu', 'kg', 1, 12000, 12, 1])
    expect(calls[2][1]).toEqual([ITEM_ID, 'kg', 1, 12000, 12])
    expect(calls[calls.length - 1][0]).toBe('COMMIT')
    expect(client.release).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json.mock.calls[0][0].data.category_name).toBe('Bahan pokok')
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

  it('mengembalikan 400 (bukan 500) bila kategori tidak ada', async () => {
    const client = { query: jest.fn(), release: jest.fn() }
    client.query
      .mockResolvedValueOnce({ rows: [] })
      .mockRejectedValueOnce(Object.assign(new Error('fk'), { code: '23503' }))
      .mockResolvedValue({ rows: [] })
    pool.connect.mockResolvedValueOnce(client)
    const res = makeRes()

    await controller.create({ user: { id: USER_ID }, body: { ...validBody, category_id: 999 } }, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json.mock.calls[0][0].errors.category_id).toBeDefined()
  })

  it('mengembalikan 500 saat koneksi database gagal', async () => {
    pool.connect.mockRejectedValueOnce(new Error('tidak bisa konek'))
    const res = makeRes()
    await controller.create({ user: { id: USER_ID }, body: validBody }, res)
    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('update', () => {
  const req = (body = validBody) => ({ user: { id: USER_ID }, params: { id: ITEM_ID }, body })

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

    await controller.update(req(), res)

    const select = client.query.mock.calls[1]
    expect(select[0]).toContain('user_id = $2')
    expect(select[1]).toEqual([ITEM_ID, USER_ID])
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('menambah riwayat hanya bila harga berubah, dan menyimpan kategori', async () => {
    const before = { purchase_unit: 'kg', purchase_qty: '1', purchase_price: '12000' }
    const client = makeClient([{ rows: [] }, { rows: [before] }, { rows: [] }, { rows: [] }, { rows: [row()] }])
    pool.connect.mockResolvedValueOnce(client)
    const res = makeRes()

    await controller.update(req({ ...validBody, purchase_price: 15000, category_id: 2 }), res)

    const calls = client.query.mock.calls
    expect(calls[2][1][5]).toBe(2)
    expect(calls.some((c) => c[0].includes('INSERT INTO ingredient_price_history'))).toBe(true)
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('tidak menambah riwayat bila hanya nama yang berubah', async () => {
    const before = { purchase_unit: 'kg', purchase_qty: '1', purchase_price: '12000' }
    const client = makeClient([{ rows: [] }, { rows: [before] }, { rows: [] }, { rows: [row()] }])
    pool.connect.mockResolvedValueOnce(client)
    await controller.update(req({ ...validBody, name: 'Tepung segitiga' }), makeRes())
    expect(client.query.mock.calls.some((c) => c[0].includes('INSERT INTO ingredient_price_history'))).toBe(false)
  })
})

describe('uploadImage', () => {
  const req = (file) => ({ user: { id: USER_ID }, params: { id: ITEM_ID }, file })
  const file = (buffer = PNG, mimetype = 'image/png') => ({ buffer, mimetype })

  it('mengembalikan 404 untuk id yang bukan UUID', async () => {
    const res = makeRes()
    await controller.uploadImage({ user: { id: USER_ID }, params: { id: '1' }, file: file() }, res)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(pool.query).not.toHaveBeenCalled()
  })

  it('mengembalikan 404 bila bahan bukan milik pengguna, tanpa mengunggah', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] })
    const res = makeRes()
    await controller.uploadImage(req(file()), res)
    expect(pool.query.mock.calls[0][1]).toEqual([ITEM_ID, USER_ID])
    expect(res.status).toHaveBeenCalledWith(404)
    expect(storage.uploadImage).not.toHaveBeenCalled()
  })

  it('mengembalikan 400 bila tidak ada berkas', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ image_url: null }] })
    const res = makeRes()
    await controller.uploadImage(req(undefined), res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('menolak berkas yang isinya bukan gambar walau tipenya image/png', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ image_url: null }] })
    const res = makeRes()
    await controller.uploadImage(req(file(Buffer.from('bukan gambar sama sekali, skrip berbahaya'))), res)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(storage.uploadImage).not.toHaveBeenCalled()
  })

  it('mengunggah, menyimpan alamat, dan menghapus gambar lama', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ image_url: 'https://contoh/lama.png' }] })
      .mockResolvedValueOnce({ rows: [{ id: ITEM_ID }] })
      .mockResolvedValueOnce({ rows: [row({ image_url: 'https://contoh/baru.png' })] })
    storage.uploadImage.mockResolvedValueOnce('https://contoh/baru.png')
    const res = makeRes()

    await controller.uploadImage(req(file()), res)

    const arg = storage.uploadImage.mock.calls[0][0]
    expect(arg.contentType).toBe('image/png')
    expect(arg.path.startsWith(`${USER_ID}/${ITEM_ID}-`)).toBe(true)
    expect(arg.path.endsWith('.png')).toBe(true)
    expect(pool.query.mock.calls[1][1]).toEqual(['https://contoh/baru.png', ITEM_ID, USER_ID])
    expect(storage.removeByUrl).toHaveBeenCalledWith('https://contoh/lama.png')
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('bila penyimpanan alamat ke database gagal, berkas yang baru diunggah dibersihkan', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ image_url: null }] })
      .mockRejectedValueOnce(new Error('db gagal'))
    storage.uploadImage.mockResolvedValueOnce('https://contoh/baru.png')
    const res = makeRes()

    await controller.uploadImage(req(file()), res)

    expect(storage.removeByUrl).toHaveBeenCalledWith('https://contoh/baru.png')
    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('mengembalikan 500 bila unggahan ke cloud gagal, tanpa mengubah database', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ image_url: null }] })
    storage.uploadImage.mockRejectedValueOnce(new Error('storage down'))
    const res = makeRes()

    await controller.uploadImage(req(file()), res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(pool.query).toHaveBeenCalledTimes(1)
  })
})

describe('remove', () => {
  const req = { user: { id: USER_ID }, params: { id: ITEM_ID } }

  it('menghapus hanya bahan milik pengguna login', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: ITEM_ID, image_url: null }] })
    const res = makeRes()
    await controller.remove(req, res)

    const [sql, params] = pool.query.mock.calls[0]
    expect(sql).toContain('user_id = $2')
    expect(params).toEqual([ITEM_ID, USER_ID])
    expect(res.status).toHaveBeenCalledWith(200)
    expect(storage.removeByUrl).not.toHaveBeenCalled()
  })

  it('ikut menghapus gambar di cloud, dan tetap sukses walau penghapusan gambar gagal', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: ITEM_ID, image_url: 'https://contoh/a.png' }] })
    storage.removeByUrl.mockRejectedValueOnce(new Error('gagal hapus'))
    const res = makeRes()
    await controller.remove(req, res)
    expect(storage.removeByUrl).toHaveBeenCalledWith('https://contoh/a.png')
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('mengembalikan 404 bila bahan tidak ditemukan', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] })
    const res = makeRes()
    await controller.remove(req, res)
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('mengembalikan 409 bila bahan masih dipakai tabel lain', async () => {
    pool.query.mockRejectedValueOnce(Object.assign(new Error('fk'), { code: '23503' }))
    const res = makeRes()
    await controller.remove(req, res)
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