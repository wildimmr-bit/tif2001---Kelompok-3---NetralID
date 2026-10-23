import { describe, it, expect } from 'vitest'
import {
  validateName,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
} from './validation'

describe('validateName', () => {
  it('menerima nama yang valid', () => {
    expect(validateName('Siti Aminah')).toBe('')
  })

  it('menolak nama kosong', () => {
    expect(validateName('')).toBe('Nama wajib diisi')
  })

  it('menolak nama yang hanya berisi spasi', () => {
    expect(validateName('   ')).toBe('Nama wajib diisi')
  })

  it('menolak nama 2 karakter (di bawah batas minimum)', () => {
    expect(validateName('Al')).toBe('Nama minimal 3 karakter')
  })

  it('menerima nama tepat 3 karakter (batas minimum)', () => {
    expect(validateName('Ali')).toBe('')
  })

  it('menghitung panjang nama setelah spasi di tepi dihapus', () => {
    expect(validateName(' Al ')).toBe('Nama minimal 3 karakter')
  })
})

describe('validateEmail', () => {
  it('menerima email yang valid', () => {
    expect(validateEmail('siti@example.com')).toBe('')
  })

  it('menolak email kosong', () => {
    expect(validateEmail('')).toBe('Email wajib diisi')
  })

  it('menolak email yang hanya berisi spasi', () => {
    expect(validateEmail('   ')).toBe('Email wajib diisi')
  })

  it('menolak email tanpa tanda @', () => {
    expect(validateEmail('sitiexample.com')).toBe('Format email tidak valid')
  })

  it('menolak email tanpa titik pada domain', () => {
    expect(validateEmail('siti@example')).toBe('Format email tidak valid')
  })

  it('menolak email yang mengandung spasi', () => {
    expect(validateEmail('siti @example.com')).toBe('Format email tidak valid')
  })
})

describe('validatePassword', () => {
  it('menerima password yang valid', () => {
    expect(validatePassword('rahasia123')).toBe('')
  })

  it('menolak password kosong', () => {
    expect(validatePassword('')).toBe('Password wajib diisi')
  })

  it('menolak password 7 karakter (di bawah batas minimum)', () => {
    expect(validatePassword('1234567')).toBe('Password minimal 8 karakter')
  })

  it('menerima password tepat 8 karakter (batas minimum)', () => {
    expect(validatePassword('12345678')).toBe('')
  })
})

describe('validateConfirmPassword', () => {
  it('menerima konfirmasi yang sama dengan password', () => {
    expect(validateConfirmPassword('rahasia123', 'rahasia123')).toBe('')
  })

  it('menolak konfirmasi kosong', () => {
    expect(validateConfirmPassword('rahasia123', '')).toBe('Konfirmasi password wajib diisi')
  })

  it('menolak konfirmasi yang berbeda', () => {
    expect(validateConfirmPassword('rahasia123', 'lain')).toBe('Konfirmasi password tidak sama')
  })

  it('membedakan huruf besar dan kecil', () => {
    expect(validateConfirmPassword('Rahasia123', 'rahasia123')).toBe('Konfirmasi password tidak sama')
  })
})