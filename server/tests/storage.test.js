const { pathFromPublicUrl } = require('../src/services/storage')

describe('pathFromPublicUrl', () => {
  const base = 'https://abc.supabase.co/storage/v1/object/public/ingredient-images'

  beforeEach(() => {
    delete process.env.SUPABASE_BUCKET
  })

  it('mengambil path di dalam bucket dari alamat publik', () => {
    expect(pathFromPublicUrl(`${base}/user-1/bahan-1.png`)).toBe('user-1/bahan-1.png')
  })

  it('membuang parameter query dan mendekode karakter', () => {
    expect(pathFromPublicUrl(`${base}/user-1/foto%20baru.png?t=123`)).toBe('user-1/foto baru.png')
  })

  it('memakai nama bucket dari SUPABASE_BUCKET', () => {
    process.env.SUPABASE_BUCKET = 'lain'
    expect(pathFromPublicUrl('https://x.co/storage/v1/object/public/lain/a/b.png')).toBe('a/b.png')
  })

  it('mengembalikan null untuk alamat dari bucket atau penyedia lain', () => {
    expect(pathFromPublicUrl('https://contoh.com/gambar.png')).toBeNull()
    expect(pathFromPublicUrl('https://x.co/storage/v1/object/public/bucket-lain/a.png')).toBeNull()
  })

  it('mengembalikan null untuk nilai yang bukan teks', () => {
    expect(pathFromPublicUrl(null)).toBeNull()
    expect(pathFromPublicUrl(undefined)).toBeNull()
  })
})