process.env.JWT_SECRET = 'secret-khusus-test'

const jwt = require('jsonwebtoken')
const {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
} = require('../src/utils/auth')

describe('hashing password', () => {
  it('menghasilkan hash yang berbeda dari teks asli', async () => {
    const hash = await hashPassword('rahasia123')
    expect(hash).not.toBe('rahasia123')
  })

  it('compare bernilai true untuk password yang cocok', async () => {
    const hash = await hashPassword('rahasia123')
    expect(await comparePassword('rahasia123', hash)).toBe(true)
  })

  it('compare bernilai false untuk password yang berbeda', async () => {
    const hash = await hashPassword('rahasia123')
    expect(await comparePassword('salah', hash)).toBe(false)
  })

  it('password yang sama menghasilkan hash berbeda (salt acak)', async () => {
    const hash1 = await hashPassword('rahasia123')
    const hash2 = await hashPassword('rahasia123')
    expect(hash1).not.toBe(hash2)
  })
})

describe('token JWT', () => {
  const user = { id: 'abc-123', role: 'owner' }

  it('token berisi id dan role pengguna', () => {
    const payload = verifyToken(generateToken(user))
    expect(payload.id).toBe('abc-123')
    expect(payload.role).toBe('owner')
  })

  it('token memiliki masa berlaku 24 jam', () => {
    const payload = verifyToken(generateToken(user))
    expect(payload.exp - payload.iat).toBe(24 * 60 * 60)
  })

  it('menolak token yang ditandatangani dengan secret lain', () => {
    const palsu = jwt.sign({ id: 'x' }, 'secret-lain')
    expect(() => verifyToken(palsu)).toThrow()
  })

  it('menolak token yang sudah kedaluwarsa', () => {
    const lama = jwt.sign({ id: 'x' }, process.env.JWT_SECRET, { expiresIn: -10 })
    expect(() => verifyToken(lama)).toThrow()
  })

  it('menolak token yang bukan JWT', () => {
    expect(() => verifyToken('bukan-token')).toThrow()
  })
})