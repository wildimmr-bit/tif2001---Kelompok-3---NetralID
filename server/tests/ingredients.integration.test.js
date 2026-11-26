// Uji integrasi ke database sungguhan. Hanya berjalan bila TEST_DATABASE_URL diisi (disarankan: branch
// Neon khusus uji, BUKAN database yang dipakai aplikasi). Tanpa itu, seluruh berkas ini dilewati,
// jadi CI di GitHub tidak terpengaruh. Contoh: TEST_DATABASE_URL=... npx jest tests/ingredients.integration
const runDb = Boolean(process.env.TEST_DATABASE_URL)
const describeDb = runDb ? describe : describe.skip

process.env.JWT_SECRET = 'secret-khusus-test'
if (runDb) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL

jest.mock('../src/services/storage', () => ({
  uploadImage: jest.fn(),
  removeByUrl: jest.fn().mockResolvedValue(undefined),
}))

const request = require('supertest')
const storage = require('../src/services/storage')
const app = require('../src/app')
const pool = require('../src/config/db')
const { generateToken } = require('../src/utils/auth')

let tokenA, tokenB, userA, kategori
const auth = (t) => ({ Authorization: `Bearer ${t}` })

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64)])
const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64)])
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), Buffer.alloc(32)])

const tambah = (token, body) => request(app).post('/api/v1/ingredients').set(auth(token)).send(body)
const bahan = (nama, extra = {}) => ({ name: nama, purchase_unit: 'kg', purchase_qty: 1, purchase_price: 10000, ...extra })

beforeAll(async () => {
  if (!runDb) return
  await pool.query("DELETE FROM users WHERE email LIKE 'p11-%@example.com'")
  const a = await pool.query("INSERT INTO users (name,email,password) VALUES ('A','p11-a@example.com','x') RETURNING id, role")
  const b = await pool.query("INSERT INTO users (name,email,password) VALUES ('B','p11-b@example.com','x') RETURNING id, role")
  userA = a.rows[0]
  tokenA = generateToken(a.rows[0]); tokenB = generateToken(b.rows[0])
  const c = await pool.query('SELECT id, name FROM categories ORDER BY id')
  kategori = Object.fromEntries(c.rows.map((r) => [r.name, r.id]))
})
afterAll(async () => {
  if (runDb) await pool.query("DELETE FROM users WHERE email LIKE 'p11-%@example.com'")
  await pool.end()
})
beforeEach(() => { storage.uploadImage.mockReset(); storage.removeByUrl.mockClear() })

describeDb('kategori', () => {
  it('tanpa token ditolak 401', async () => {
    expect((await request(app).get('/api/v1/categories')).status).toBe(401)
  })
  it('daftar kategori berisi 8 kategori awal', async () => {
    const res = await request(app).get('/api/v1/categories').set(auth(tokenA))
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(8)
    expect(res.body.data.map((c) => c.name)).toContain('Bahan pokok')
  })
})

describeDb('tambah dan ubah dengan kategori', () => {
  it('menyimpan kategori dan mengembalikan nama kategorinya', async () => {
    const res = await tambah(tokenA, bahan('Tepung terigu', { category_id: kategori['Bahan pokok'] }))
    expect(res.status).toBe(201)
    expect(res.body.data.category_id).toBe(kategori['Bahan pokok'])
    expect(res.body.data.category_name).toBe('Bahan pokok')
    expect(res.body.data.image_url).toBeNull()
  })
  it('kategori boleh kosong', async () => {
    const res = await tambah(tokenA, bahan('Garam'))
    expect(res.status).toBe(201)
    expect(res.body.data.category_id).toBeNull()
    expect(res.body.data.category_name).toBeNull()
  })
  it('kategori yang tidak ada ditolak 400 (bukan 500)', async () => {
    const res = await tambah(tokenA, bahan('Aneh', { category_id: 9999 }))
    expect(res.status).toBe(400)
    expect(res.body.errors.category_id).toBeDefined()
  })
  it('kategori bukan angka ditolak 400', async () => {
    const res = await tambah(tokenA, bahan('Aneh', { category_id: 'abc' }))
    expect(res.status).toBe(400)
  })
  it('ubah kategori bahan', async () => {
    const list = await request(app).get('/api/v1/ingredients?search=garam').set(auth(tokenA))
    const id = list.body.data[0].id
    const res = await request(app).put(`/api/v1/ingredients/${id}`).set(auth(tokenA))
      .send(bahan('Garam', { category_id: kategori['Bumbu dan rempah'] }))
    expect(res.status).toBe(200)
    expect(res.body.data.category_name).toBe('Bumbu dan rempah')
  })
})

describeDb('pencarian, filter, dan paginasi', () => {
  beforeAll(async () => {
    const data = [
      ['Gula pasir', 'Bahan pokok'], ['Gula merah', 'Bahan pokok'], ['Kecap manis', 'Bumbu dan rempah'],
      ['Lada bubuk', 'Bumbu dan rempah'], ['Telur ayam', 'Protein'], ['Daging sapi', 'Protein'],
      ['Susu cair', 'Susu dan olahan'], ['Keju cheddar', 'Susu dan olahan'], ['Minyak goreng', 'Minyak dan lemak'],
      ['Diskon 100% manis', null], ['Bahan_unik', null],
    ]
    for (const [nama, kat] of data) {
      const r = await tambah(tokenA, bahan(nama, kat ? { category_id: kategori[kat] } : {}))
      expect(r.status).toBe(201)
    }
    await tambah(tokenB, bahan('Gula milik B'))
  })

  const ambil = (qs, token = tokenA) => request(app).get(`/api/v1/ingredients${qs}`).set(auth(token))

  it('tanpa parameter: halaman 1, limit 10, dengan metadata', async () => {
    const res = await ambil('')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(10)
    expect(res.body.meta).toEqual({ totalRows: 13, totalPages: 2, currentPage: 1, limit: 10 })
  })
  it('halaman 2 berisi sisa data', async () => {
    const res = await ambil('?page=2')
    expect(res.body.data).toHaveLength(3)
    expect(res.body.meta.currentPage).toBe(2)
  })
  it('limit dan halaman dihitung dengan offset = (page - 1) x limit', async () => {
    const p1 = await ambil('?limit=5&page=1'); const p2 = await ambil('?limit=5&page=2'); const p3 = await ambil('?limit=5&page=3')
    expect(p1.body.meta).toMatchObject({ totalRows: 13, totalPages: 3, limit: 5 })
    const semua = [...p1.body.data, ...p2.body.data, ...p3.body.data].map((x) => x.name)
    expect(semua).toHaveLength(13)
    expect(new Set(semua).size).toBe(13)
  })
  it('urut nama tanpa membedakan huruf besar dan kecil', async () => {
    const res = await ambil('?limit=50')
    const nama = res.body.data.map((x) => x.name)
    expect(nama).toEqual([...nama].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())))
  })
  it('halaman di luar jangkauan: data kosong tapi metadata benar', async () => {
    const res = await ambil('?page=99')
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
    expect(res.body.meta.totalRows).toBe(13)
  })
  it('pencarian tidak membedakan huruf besar dan kecil (ILIKE)', async () => {
    const res = await ambil('?search=GULA')
    expect(res.body.data.map((x) => x.name).sort()).toEqual(['Gula merah', 'Gula pasir'])
    expect(res.body.meta.totalRows).toBe(2)
  })
  it('pencarian memotong sebagian kata', async () => {
    expect((await ambil('?search=elur')).body.data.map((x) => x.name)).toEqual(['Telur ayam'])
  })
  it('karakter % dan _ dicari apa adanya, bukan sebagai wildcard', async () => {
    expect((await ambil('?search=100%25')).body.data.map((x) => x.name)).toEqual(['Diskon 100% manis'])
    expect((await ambil('?search=bahan_unik')).body.data.map((x) => x.name)).toEqual(['Bahan_unik'])
    expect((await ambil('?search=%25')).body.data).toHaveLength(1)
    expect((await ambil('?search=_')).body.data).toHaveLength(1)
  })
  it('filter satu kategori', async () => {
    const res = await ambil(`?category=${kategori['Protein']}`)
    expect(res.body.data.map((x) => x.name).sort()).toEqual(['Daging sapi', 'Telur ayam'])
  })
  it('filter beberapa kategori sekaligus', async () => {
    const res = await ambil(`?category=${kategori['Protein']},${kategori['Susu dan olahan']}`)
    expect(res.body.meta.totalRows).toBe(4)
  })
  it('pencarian digabung filter kategori dan paginasi', async () => {
    const res = await ambil(`?search=gula&category=${kategori['Bahan pokok']}&limit=1&page=2`)
    expect(res.body.meta).toMatchObject({ totalRows: 2, totalPages: 2, currentPage: 2, limit: 1 })
    expect(res.body.data).toHaveLength(1)
  })
  it('hasil tidak ditemukan: data kosong dan totalPages minimal 1', async () => {
    const res = await ambil('?search=tidakada')
    expect(res.body.data).toEqual([])
    expect(res.body.meta).toMatchObject({ totalRows: 0, totalPages: 1 })
  })
  it('hanya menampilkan bahan milik sendiri', async () => {
    const res = await ambil('?search=gula', tokenB)
    expect(res.body.data.map((x) => x.name)).toEqual(['Gula milik B'])
  })
  it('parameter tidak valid ditolak 400', async () => {
    for (const qs of ['?page=0', '?page=abc', '?limit=0', '?limit=51', '?category=abc', '?category=1,x', '?category=-1', `?search=${'a'.repeat(101)}`]) {
      const res = await ambil(qs)
      expect(res.status).toBe(400)
    }
  })
  it('upaya injeksi SQL lewat pencarian dan kategori tidak berhasil', async () => {
    const res = await ambil("?search=%27%3B%20DROP%20TABLE%20ingredients%3B--")
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
    expect((await ambil("?category=1;DROP TABLE users")).status).toBe(400)
    expect((await ambil('')).body.meta.totalRows).toBe(13)
  })
})

describeDb('unggah gambar', () => {
  let id
  beforeAll(async () => {
    const r = await tambah(tokenA, bahan('Bahan bergambar'))
    id = r.body.data.id
  })
  const kirim = (token, targetId, buffer, filename, contentType) => {
    const req = request(app).post(`/api/v1/ingredients/${targetId}/image`).set(auth(token))
    return buffer ? req.attach('image', buffer, { filename, contentType }) : req
  }

  it('tanpa token ditolak 401', async () => {
    expect((await request(app).post(`/api/v1/ingredients/${id}/image`)).status).toBe(401)
  })
  it('tanpa berkas ditolak 400', async () => {
    expect((await kirim(tokenA, id)).status).toBe(400)
  })
  it('tipe selain jpeg, png, webp ditolak 400 dan tidak diunggah', async () => {
    const res = await kirim(tokenA, id, Buffer.from('<script>alert(1)</script>'), 'x.html', 'text/html')
    expect(res.status).toBe(400)
    expect(storage.uploadImage).not.toHaveBeenCalled()
  })
  it('berkas di atas 2 MB ditolak 413 dan tidak diunggah', async () => {
    const besar = Buffer.concat([PNG, Buffer.alloc(2 * 1024 * 1024)])
    const res = await kirim(tokenA, id, besar, 'besar.png', 'image/png')
    expect(res.status).toBe(413)
    expect(storage.uploadImage).not.toHaveBeenCalled()
  })
  it('berkas tepat di bawah 2 MB diterima', async () => {
    storage.uploadImage.mockResolvedValue('https://contoh.example/storage/v1/object/public/ingredient-images/ok.png')
    const pas = Buffer.concat([PNG, Buffer.alloc(2 * 1024 * 1024 - PNG.length - 10)])
    const res = await kirim(tokenA, id, pas, 'pas.png', 'image/png')
    expect(res.status).toBe(200)
  })
  it('berkas yang menyamar (isi bukan gambar tapi diberi tipe image/png) ditolak 400', async () => {
    const res = await kirim(tokenA, id, Buffer.from('ini skrip berbahaya, bukan gambar sama sekali'), 'palsu.png', 'image/png')
    expect(res.status).toBe(400)
    expect(storage.uploadImage).not.toHaveBeenCalled()
  })
  it('isi jpeg dengan tipe png ditolak 400 (tidak cocok)', async () => {
    const res = await kirim(tokenA, id, JPG, 'a.png', 'image/png')
    expect(res.status).toBe(400)
  })
  it('bahan milik pengguna lain ditolak 404 dan tidak diunggah', async () => {
    const res = await kirim(tokenB, id, PNG, 'a.png', 'image/png')
    expect(res.status).toBe(404)
    expect(storage.uploadImage).not.toHaveBeenCalled()
  })
  it('id bukan UUID ditolak 404', async () => {
    expect((await kirim(tokenA, '123', PNG, 'a.png', 'image/png')).status).toBe(404)
  })
  it('jpeg, png, dan webp diterima, alamat publik disimpan, dan path memuat id pengguna', async () => {
    for (const [buf, mime, ext] of [[JPG, 'image/jpeg', 'jpg'], [PNG, 'image/png', 'png'], [WEBP, 'image/webp', 'webp']]) {
      storage.uploadImage.mockResolvedValueOnce(`https://contoh.example/storage/v1/object/public/ingredient-images/${ext}`)
      const res = await kirim(tokenA, id, buf, `foto.${ext}`, mime)
      expect(res.status).toBe(200)
      expect(res.body.data.image_url).toContain(ext)
      const arg = storage.uploadImage.mock.calls.at(-1)[0]
      expect(arg.contentType).toBe(mime)
      expect(arg.path.startsWith(`${userA.id}/${id}-`)).toBe(true)
      expect(arg.path.endsWith(`.${ext}`)).toBe(true)
    }
  })
  it('mengganti gambar menghapus gambar lama', async () => {
    storage.uploadImage.mockResolvedValueOnce('https://contoh.example/baru.png')
    const sebelum = await request(app).get('/api/v1/ingredients?search=bergambar').set(auth(tokenA))
    const lama = sebelum.body.data[0].image_url
    await kirim(tokenA, id, PNG, 'baru.png', 'image/png')
    expect(storage.removeByUrl).toHaveBeenCalledWith(lama)
  })
  it('gagal di storage: server menjawab 500 dan alamat gambar tidak berubah', async () => {
    const sebelum = (await request(app).get('/api/v1/ingredients?search=bergambar').set(auth(tokenA))).body.data[0].image_url
    storage.uploadImage.mockRejectedValueOnce(new Error('storage down'))
    jest.spyOn(console, 'error').mockImplementation(() => {})
    const res = await kirim(tokenA, id, PNG, 'x.png', 'image/png')
    expect(res.status).toBe(500)
    const sesudah = (await request(app).get('/api/v1/ingredients?search=bergambar').set(auth(tokenA))).body.data[0].image_url
    expect(sesudah).toBe(sebelum)
    console.error.mockRestore()
  })
  it('menghapus bahan ikut menghapus gambarnya di storage', async () => {
    const dihapus = await request(app).delete(`/api/v1/ingredients/${id}`).set(auth(tokenA))
    expect(dihapus.status).toBe(200)
    expect(storage.removeByUrl).toHaveBeenCalledTimes(1)
  })
})