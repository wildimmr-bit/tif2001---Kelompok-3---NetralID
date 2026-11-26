const express = require('express')
const request = require('supertest')
const uploadImage = require('../src/middlewares/uploadImage')

const app = express()
app.post('/upload', uploadImage, (req, res) => {
  res.status(200).json({ name: req.file.originalname, size: req.file.size, hasBuffer: Buffer.isBuffer(req.file.buffer) })
})

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64)])
const MB = 1024 * 1024

describe('middleware unggah gambar', () => {
  it('batas ukuran 2 MB dan tipe yang diizinkan sesuai aturan tugas', () => {
    expect(uploadImage.MAX_BYTES).toBe(2 * MB)
    expect(uploadImage.ALLOWED_TYPES).toEqual(['image/jpeg', 'image/png', 'image/webp'])
  })

  it('menerima gambar yang sah dan menyimpannya di memori', async () => {
    const res = await request(app).post('/upload').attach('image', PNG, { filename: 'a.png', contentType: 'image/png' })
    expect(res.status).toBe(200)
    expect(res.body.hasBuffer).toBe(true)
    expect(res.body.size).toBe(PNG.length)
  })

  it('menerima berkas tepat 2 MB', async () => {
    const pas = Buffer.concat([PNG, Buffer.alloc(2 * MB - PNG.length)])
    const res = await request(app).post('/upload').attach('image', pas, { filename: 'pas.png', contentType: 'image/png' })
    expect(res.status).toBe(200)
  })

  it('menolak berkas lebih dari 2 MB dengan 413', async () => {
    const besar = Buffer.concat([PNG, Buffer.alloc(2 * MB)])
    const res = await request(app).post('/upload').attach('image', besar, { filename: 'besar.png', contentType: 'image/png' })
    expect(res.status).toBe(413)
    expect(res.body.message).toMatch(/2 MB/)
  })

  it('menolak tipe selain jpeg, png, webp dengan 400', async () => {
    for (const [name, type] of [['a.html', 'text/html'], ['a.gif', 'image/gif'], ['a.svg', 'image/svg+xml'], ['a.pdf', 'application/pdf']]) {
      const res = await request(app).post('/upload').attach('image', Buffer.from('isi'), { filename: name, contentType: type })
      expect(res.status).toBe(400)
    }
  })

  it('menolak kolom dengan nama lain agar tidak ada berkas liar', async () => {
    const res = await request(app).post('/upload').attach('foto', PNG, { filename: 'a.png', contentType: 'image/png' })
    expect(res.status).toBe(400)
  })

  it('menolak lebih dari satu berkas', async () => {
    const res = await request(app)
      .post('/upload')
      .attach('image', PNG, { filename: 'a.png', contentType: 'image/png' })
      .attach('image', PNG, { filename: 'b.png', contentType: 'image/png' })
    expect(res.status).toBe(400)
  })
})