const request = require('supertest')

process.env.JWT_SECRET = 'secret-khusus-test'

// 1. Mock storage
jest.mock('../src/services/storage', () => ({
  uploadImage: jest.fn().mockResolvedValue('https://example.com/img.png'),
  removeByUrl: jest.fn().mockResolvedValue(),
  pathFromPublicUrl: jest.fn(),
}))

// 2. Mock database (BARU, taruh di sini; ganti baris "// jest.mock('../src/config/db')")
jest.mock('../src/config/db', () => ({ query: jest.fn(), connect: jest.fn() }))
const pool = require('../src/config/db')

beforeEach(() => {
  pool.query.mockReset()
  pool.connect.mockReset()
})

// 3. Baru setelah itu muat app
const app = require('../src/app')
const jwt = require('jsonwebtoken')

const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET)
const auth = { Authorization: `Bearer ${token}` }
const base = '/api/v1/ingredients'

// ... lalu semua blok describe(...) di bawah ini

describe('Auth: semua route bahan wajib token', () => {
  test.each([
    ['get', base],
    ['post', base],
    ['put', `${base}/1`],
    ['delete', `${base}/1`],
    ['get', `${base}/1/history`],
    ['post', `${base}/1/image`],
  ])('%s %s tanpa token -> 401', async (method, url) => {
    const res = await request(app)[method](url)
    expect(res.status).toBe(401)
  })
})

describe('Create', () => {
  test('body kosong -> 400', async () => {
    const res = await request(app).post(base).set(auth).send({})
    expect(res.status).toBe(400)
  })
})

describe('Read (list, search, paginasi)', () => {
  test('list memuat metadata paginasi', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ total: 23 }] }) // COUNT
      .mockResolvedValueOnce({ rows: [] })              // data
    const res = await request(app).get(`${base}?page=1&limit=10`).set(auth)
    expect(res.status).toBe(200)
    expect(res.body.meta).toMatchObject({
      totalRows: 23,
      totalPages: 3,
      currentPage: 1,
      limit: 10,
    })
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  test('search masuk ke query SQL sebagai ILIKE', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ total: 0 }] })
      .mockResolvedValueOnce({ rows: [] })
    const res = await request(app).get(`${base}?search=garam`).set(auth)
    expect(res.status).toBe(200)
    const [sql, params] = pool.query.mock.calls[0]
    expect(sql).toMatch(/ilike/i)
    expect(params).toEqual([1, '%garam%'])  
  })

  test('limit diteruskan ke query (LIMIT/OFFSET)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ total: 50 }] })
      .mockResolvedValueOnce({ rows: [] })
    const res = await request(app).get(`${base}?page=3&limit=5`).set(auth)
    expect(res.status).toBe(200)
    const params = pool.query.mock.calls[1][1]
    expect(params.slice(-2)).toEqual([5, 10]) // limit=5, offset=(3-1)*5
    expect(res.body.meta.totalPages).toBe(10)
  })
  test('filter kategori memakai ANY(int[])', async () => {
  pool.query
    .mockResolvedValueOnce({ rows: [{ total: 0 }] })
    .mockResolvedValueOnce({ rows: [] })
  const res = await request(app).get(`${base}?category=1,3`).set(auth)
  expect(res.status).toBe(200)
  const [sql, params] = pool.query.mock.calls[0]
  expect(sql).toMatch(/category_id = ANY/i)
  expect(params).toEqual([1, [1, 3]])
})

test('search meng-escape karakter wildcard', async () => {
  pool.query
    .mockResolvedValueOnce({ rows: [{ total: 0 }] })
    .mockResolvedValueOnce({ rows: [] })
  await request(app).get(`${base}?search=${encodeURIComponent('50%')}`).set(auth)
  const params = pool.query.mock.calls[0][1]
  expect(params[1]).not.toBe('%50%%')   // % dari pengguna tidak boleh jadi wildcard mentah
})
})

describe('Update & Delete', () => {
  test('update ID tidak ada -> 404', async () => {
    const res = await request(app).put(`${base}/999999`).set(auth).send({ name: 'X' })
    expect(res.status).toBe(404)
  })

  test('delete ID tidak ada -> 404', async () => {
    const res = await request(app).delete(`${base}/999999`).set(auth)
    expect(res.status).toBe(404)
  })
})

describe('History', () => {
  test('ID tidak ada -> 404', async () => {
    const res = await request(app).get(`${base}/999999/history`).set(auth)
    expect(res.status).toBe(404)
  })
})

describe('Upload gambar', () => {
  test('tipe file salah ditolak', async () => {
    const res = await request(app)
      .post(`${base}/1/image`)
      .set(auth)
      .attach('image', Buffer.from('bukan gambar'), { filename: 'x.txt', contentType: 'text/plain' })
    expect([400, 415]).toContain(res.status)
  })

  test('file > 2 MB ditolak', async () => {
    const big = Buffer.alloc(2 * 1024 * 1024 + 1)
    const res = await request(app)
      .post(`${base}/1/image`)
      .set(auth)
      .attach('image', big, { filename: 'big.png', contentType: 'image/png' })
    expect([400, 413]).toContain(res.status)
  })
})
