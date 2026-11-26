const { detectImageType, EXTENSIONS } = require('../src/utils/imageSignature')

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32)])
const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(32)])
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), Buffer.alloc(32)])

describe('detectImageType', () => {
  it('mengenali JPEG, PNG, dan WebP dari isi berkas', () => {
    expect(detectImageType(JPG)).toBe('image/jpeg')
    expect(detectImageType(PNG)).toBe('image/png')
    expect(detectImageType(WEBP)).toBe('image/webp')
  })

  it('menolak teks, skrip, dan HTML', () => {
    expect(detectImageType(Buffer.from('<script>alert(1)</script>   '))).toBeNull()
    expect(detectImageType(Buffer.from('GIF89a......................'))).toBeNull()
  })

  it('menolak RIFF yang bukan WebP (misalnya WAV)', () => {
    const wav = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WAVE'), Buffer.alloc(32)])
    expect(detectImageType(wav)).toBeNull()
  })

  it('menolak berkas terlalu pendek, kosong, dan bukan buffer', () => {
    expect(detectImageType(Buffer.alloc(0))).toBeNull()
    expect(detectImageType(Buffer.from([0xff, 0xd8, 0xff]))).toBeNull()
    expect(detectImageType('teks')).toBeNull()
    expect(detectImageType(null)).toBeNull()
  })

  it('setiap tipe yang diizinkan punya ekstensi', () => {
    expect(EXTENSIONS).toEqual({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' })
  })
})