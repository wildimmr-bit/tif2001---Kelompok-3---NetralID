// Daftar tombol halaman. Contoh: halaman 10 dari 20 menjadi [1, '…', 9, 10, 11, '…', 20].
export const buildPageItems = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages = new Set([1, total, current - 1, current, current + 1])
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p))
  if (current >= total - 2) [total - 1, total - 2, total - 3].forEach((p) => pages.add(p))

  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const items = []
  sorted.forEach((page, index) => {
    if (index > 0) {
      const gap = page - sorted[index - 1]
      // Satu halaman yang terlewat ditampilkan langsung, bukan diganti tanda jeda.
      if (gap === 2) items.push(page - 1)
      else if (gap > 2) items.push('…')
    }
    items.push(page)
  })
  return items
}