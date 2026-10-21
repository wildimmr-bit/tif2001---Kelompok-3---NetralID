export const validateName = (name) => {
  if (!name.trim()) return 'Nama wajib diisi'
  if (name.trim().length < 3) return 'Nama minimal 3 karakter'
  return ''
}

export const validateEmail = (email) => {
  if (!email.trim()) return 'Email wajib diisi'
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!pattern.test(email)) return 'Format email tidak valid'
  return ''
}

export const validatePassword = (password) => {
  if (!password) return 'Password wajib diisi'
  if (password.length < 8) return 'Password minimal 8 karakter'
  return ''
}

export const validateConfirmPassword = (password, confirm) => {
  if (!confirm) return 'Konfirmasi password wajib diisi'
  if (password !== confirm) return 'Konfirmasi password tidak sama'
  return ''
}