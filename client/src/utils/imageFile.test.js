import { describe, it, expect } from 'vitest'
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, validateImageFile } from './imageFile'

const berkas = (type, size) => ({ type, size })

describe('validateImageFile', () => {
  it('aturan sama dengan server: 2 MB dan tiga tipe gambar', () => {
    expect(MAX_IMAGE_BYTES).toBe(2 * 1024 * 1024)
    expect(ALLOWED_IMAGE_TYPES).toEqual(['image/jpeg', 'image/png', 'image/webp'])
  })

  it('tanpa berkas dianggap valid (gambar bersifat opsional)', () => {
    expect(validateImageFile(null)).toBe('')
    expect(validateImageFile(undefined)).toBe('')
  })

  it('menerima jpeg, png, dan webp', () => {
    ALLOWED_IMAGE_TYPES.forEach((type) => {
      expect(validateImageFile(berkas(type, 1000))).toBe('')
    })
  })

  it('menolak tipe selain jpeg, png, webp', () => {
    ;['image/gif', 'image/svg+xml', 'application/pdf', 'text/html', ''].forEach((type) => {
      expect(validateImageFile(berkas(type, 1000))).toBe('Gambar harus berformat JPEG, PNG, atau WebP')
    })
  })

  it('menerima ukuran tepat 2 MB, dan menolak 1 byte di atasnya', () => {
    expect(validateImageFile(berkas('image/png', MAX_IMAGE_BYTES))).toBe('')
    expect(validateImageFile(berkas('image/png', MAX_IMAGE_BYTES + 1))).toBe('Ukuran gambar maksimal 2 MB')
  })

  it('memeriksa tipe lebih dulu daripada ukuran', () => {
    expect(validateImageFile(berkas('image/gif', MAX_IMAGE_BYTES + 1))).toBe(
      'Gambar harus berformat JPEG, PNG, atau WebP'
    )
  })
})