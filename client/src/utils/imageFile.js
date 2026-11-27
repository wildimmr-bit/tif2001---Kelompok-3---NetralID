// Aturan yang sama dengan server: maksimal 2 MB, hanya JPEG, PNG, dan WebP.
// Pemeriksaan di sini hanya untuk memberi tahu pengguna lebih cepat. Server tetap memeriksa ulang.
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export const validateImageFile = (file) => {
  if (!file) return ''
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'Gambar harus berformat JPEG, PNG, atau WebP'
  if (file.size > MAX_IMAGE_BYTES) return 'Ukuran gambar maksimal 2 MB'
  return ''
}