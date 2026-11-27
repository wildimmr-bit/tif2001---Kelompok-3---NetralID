import { useEffect, useRef, useState } from 'react'
import {
  clearToken,
  createIngredient,
  deleteIngredient,
  getIngredientHistory,
  listCategories,
  listIngredients,
  updateIngredient,
  uploadIngredientImage,
} from '../services/ingredientService'
import useDebounce from '../hooks/useDebounce'
import {
  UNIT_GROUPS,
  describeConversion,
  formatRupiah,
  getBaseUnit,
  pricePerBase,
} from '../utils/units'
import {
  parseQty,
  validateIngredientName,
  validateIngredientPrice,
  validateIngredientQty,
  validateIngredientUnit,
} from '../utils/ingredientValidation'
import { validateImageFile } from '../utils/imageFile'
import { buildPageItems } from '../utils/pageItems'
import './Ingredients.css'

const PAGE_LIMIT = 10
const emptyForm = { name: '', unit: '', qty: '', price: '', categoryId: '' }
const noImage = { file: null, previewUrl: '' }

const redirectToLogin = () => {
  clearToken()
  window.location.assign('/login')
}

const formatDate = (value) =>
  new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

export default function Ingredients() {
  // Pencarian, filter, dan halaman. Perubahan pencarian ditunda 400 ms agar server tidak dipanggil di setiap huruf.
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const [categoryIds, setCategoryIds] = useState([])
  const [page, setPage] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)

  const [categories, setCategories] = useState([])
  // Hasil disimpan bersama kunci permintaannya. Selama kunci hasil belum sama dengan kunci terbaru, tampilan memuat.
  const [result, setResult] = useState({ key: '', items: [], meta: null, error: '' })
  const requestKey = JSON.stringify([debouncedSearch.trim(), categoryIds, page, refreshKey])
  const loading = result.key !== requestKey

  const [notice, setNotice] = useState('')
  const [actionError, setActionError] = useState('')

  const [form, setForm] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editingImageUrl, setEditingImageUrl] = useState('')
  const [image, setImage] = useState(noImage)
  const [imageError, setImageError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const [historyId, setHistoryId] = useState(null)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const previewRef = useRef('')

  useEffect(() => {
    let cancelled = false
    listCategories()
      .then((data) => {
        if (!cancelled) setCategories(data)
      })
      .catch((err) => {
        if (!cancelled && err.status === 401) redirectToLogin()
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    listIngredients({
      search: debouncedSearch.trim(),
      category: categoryIds.join(','),
      page,
      limit: PAGE_LIMIT,
    })
      .then(({ items, meta }) => {
        if (cancelled) return
        // Halaman terakhir kosong (misalnya setelah menghapus bahan terakhir di halaman itu): mundur satu halaman.
        if (items.length === 0 && meta.currentPage > meta.totalPages) {
          setPage(meta.totalPages)
          return
        }
        setResult({ key: requestKey, items, meta, error: '' })
      })
      .catch((err) => {
        if (cancelled) return
        if (err.status === 401) {
          redirectToLogin()
          return
        }
        setResult({ key: requestKey, items: [], meta: null, error: err.message })
      })
    return () => {
      cancelled = true
    }
  }, [debouncedSearch, categoryIds, page, requestKey])

  // Membebaskan alamat pratinjau gambar saat halaman ditutup.
  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    },
    []
  )

  const handleSearchChange = (event) => {
    setSearch(event.target.value)
    setPage(1)
  }

  const toggleCategory = (id) => {
    setCategoryIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    )
    setPage(1)
  }

  const clearCategories = () => {
    setCategoryIds([])
    setPage(1)
  }

  const resetImage = () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    previewRef.current = ''
    setImage(noImage)
    setImageError('')
  }

  const openNew = () => {
    resetImage()
    setEditingId(null)
    setEditingImageUrl('')
    setForm(emptyForm)
    setFieldErrors({})
    setFormError('')
    setNotice('')
    setActionError('')
  }

  const openEdit = (item) => {
    resetImage()
    setEditingId(item.id)
    setEditingImageUrl(item.image_url || '')
    setForm({
      name: item.name,
      unit: item.purchase_unit,
      qty: String(item.purchase_qty),
      price: String(item.purchase_price),
      categoryId: item.category_id ? String(item.category_id) : '',
    })
    setFieldErrors({})
    setFormError('')
    setNotice('')
    setActionError('')
  }

  const closeForm = () => {
    resetImage()
    setForm(null)
    setEditingId(null)
    setEditingImageUrl('')
  }

  const updateField = (field) => (event) => setForm({ ...form, [field]: event.target.value })

  const handleImageChange = (event) => {
    const file = event.target.files[0]
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    previewRef.current = ''

    if (!file) {
      setImage(noImage)
      setImageError('')
      return
    }
    const message = validateImageFile(file)
    if (message) {
      event.target.value = ''
      setImage(noImage)
      setImageError(message)
      return
    }
    previewRef.current = URL.createObjectURL(file)
    setImage({ file, previewUrl: previewRef.current })
    setImageError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const errors = {
      name: validateIngredientName(form.name),
      purchase_unit: validateIngredientUnit(form.unit),
      purchase_qty: validateIngredientQty(form.qty),
      purchase_price: validateIngredientPrice(form.price),
    }
    setFieldErrors(errors)
    setFormError('')
    if (Object.values(errors).some(Boolean)) return

    const payload = {
      name: form.name.trim(),
      purchase_unit: form.unit,
      purchase_qty: parseQty(form.qty),
      purchase_price: Number(form.price),
      category_id: form.categoryId ? Number(form.categoryId) : null,
    }
    const wasEditing = Boolean(editingId)
    const fileToUpload = image.file

    setSaving(true)
    setActionError('')
    try {
      const saved = wasEditing
        ? await updateIngredient(editingId, payload)
        : await createIngredient(payload)

      let imageProblem = ''
      if (fileToUpload) {
        try {
          await uploadIngredientImage(saved.id, fileToUpload)
        } catch (err) {
          if (err.status === 401) {
            redirectToLogin()
            return
          }
          imageProblem = err.message
        }
      }

      closeForm()
      if (imageProblem) {
        setNotice('')
        setActionError(
          `Bahan tersimpan, tetapi gambar gagal diunggah: ${imageProblem}. Coba lagi lewat tombol Ubah.`
        )
      } else {
        setNotice(wasEditing ? 'Bahan berhasil diperbarui' : 'Bahan berhasil ditambahkan')
      }
      setRefreshKey((key) => key + 1)
    } catch (err) {
      if (err.status === 401) {
        redirectToLogin()
        return
      }
      if (err.status === 400 && Object.keys(err.errors).length > 0) {
        setFieldErrors(err.errors)
      } else if (err.status === 409) {
        setFieldErrors({ name: err.message })
      } else {
        setFormError(err.message)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Hapus bahan "${item.name}"?`)) return
    setActionError('')
    setNotice('')
    try {
      await deleteIngredient(item.id)
      setNotice('Bahan berhasil dihapus')
      if (historyId === item.id) setHistoryId(null)
      setRefreshKey((key) => key + 1)
    } catch (err) {
      if (err.status === 401) {
        redirectToLogin()
        return
      }
      setActionError(err.message)
    }
  }

  const toggleHistory = async (item) => {
    if (historyId === item.id) {
      setHistoryId(null)
      return
    }
    setHistoryId(item.id)
    setHistory([])
    setHistoryLoading(true)
    try {
      setHistory(await getIngredientHistory(item.id))
    } catch (err) {
      if (err.status === 401) {
        redirectToLogin()
        return
      }
      setActionError(err.message)
      setHistoryId(null)
    } finally {
      setHistoryLoading(false)
    }
  }

  // Pratinjau konversi, hanya tampil bila semua isian sudah valid.
  let preview = ''
  if (
    form &&
    !validateIngredientUnit(form.unit) &&
    !validateIngredientQty(form.qty) &&
    !validateIngredientPrice(form.price)
  ) {
    const qty = parseQty(form.qty)
    const perBase = pricePerBase(Number(form.price), qty, form.unit)
    preview = `${describeConversion(qty, form.unit)} → ${formatRupiah(perBase)} per ${getBaseUnit(form.unit)}`
  }

  const { items, meta } = result
  const showResult = !loading && !result.error
  const isFiltering = debouncedSearch.trim() !== '' || categoryIds.length > 0
  const currentImage = image.previewUrl || editingImageUrl

  return (
    <main className="ingredients-page">
      <header className="ingredients-header">
        <h1>Bahan</h1>
        <div className="header-actions">
          {!form && (
            <button type="button" className="btn-primary" onClick={openNew}>
              Tambah bahan
            </button>
          )}
          <button type="button" className="btn-secondary" onClick={redirectToLogin}>
            Keluar
          </button>
        </div>
      </header>

      <div aria-live="polite">
        {notice && <p className="notice">{notice}</p>}
        {actionError && (
          <p role="alert" className="error-text">
            {actionError}
          </p>
        )}
      </div>

      {form && (
        <form className="ingredient-form" onSubmit={handleSubmit} noValidate>
          <h2>{editingId ? 'Ubah bahan' : 'Tambah bahan'}</h2>

          <div className="field">
            <label htmlFor="ingredient-name">Nama bahan</label>
            <input
              id="ingredient-name"
              type="text"
              value={form.name}
              onChange={updateField('name')}
              placeholder="Contoh: Tepung terigu"
            />
            {fieldErrors.name && <p className="error-text">{fieldErrors.name}</p>}
          </div>

          <div className="field">
            <label htmlFor="ingredient-category">Kategori</label>
            <select
              id="ingredient-category"
              value={form.categoryId}
              onChange={updateField('categoryId')}
            >
              <option value="">Tanpa kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {fieldErrors.category_id && <p className="error-text">{fieldErrors.category_id}</p>}
          </div>

          <div className="field">
            <label htmlFor="ingredient-unit">Satuan</label>
            <select id="ingredient-unit" value={form.unit} onChange={updateField('unit')}>
              <option value="">Pilih satuan</option>
              {UNIT_GROUPS.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.units.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {fieldErrors.purchase_unit && <p className="error-text">{fieldErrors.purchase_unit}</p>}
          </div>

          <div className="field">
            <label htmlFor="ingredient-qty">Jumlah yang dibeli</label>
            <input
              id="ingredient-qty"
              type="text"
              inputMode="decimal"
              value={form.qty}
              onChange={updateField('qty')}
              placeholder="Contoh: 1 atau 0,5"
            />
            {fieldErrors.purchase_qty && <p className="error-text">{fieldErrors.purchase_qty}</p>}
          </div>

          <div className="field">
            <label htmlFor="ingredient-price">Harga beli (Rp)</label>
            <input
              id="ingredient-price"
              type="text"
              inputMode="numeric"
              value={form.price}
              onChange={updateField('price')}
              placeholder="Contoh: 12000"
            />
            {fieldErrors.purchase_price && (
              <p className="error-text">{fieldErrors.purchase_price}</p>
            )}
          </div>

          <div className="field">
            <label htmlFor="ingredient-image">Gambar (opsional, maksimal 2 MB)</label>
            {currentImage && (
              <img className="image-preview" src={currentImage} alt="Pratinjau gambar bahan" />
            )}
            <input
              id="ingredient-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
            />
            {imageError && <p className="error-text">{imageError}</p>}
          </div>

          {preview && <p className="preview">{preview}</p>}
          {formError && (
            <p role="alert" className="error-text">
              {formError}
            </p>
          )}

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button type="button" className="btn-secondary" onClick={closeForm} disabled={saving}>
              Batal
            </button>
          </div>
        </form>
      )}

      <section className="filters" aria-label="Pencarian dan filter">
        <input
          type="search"
          className="search-input"
          aria-label="Cari bahan"
          placeholder="Cari bahan..."
          value={search}
          onChange={handleSearchChange}
        />
        {categories.length > 0 && (
          <div className="chips">
            <button
              type="button"
              className="chip"
              aria-pressed={categoryIds.length === 0}
              onClick={clearCategories}
            >
              Semua
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                className="chip"
                aria-pressed={categoryIds.includes(category.id)}
                onClick={() => toggleCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}
      </section>

      {loading && <p>Memuat bahan... (server gratis kadang perlu beberapa detik untuk bangun)</p>}

      {!loading && result.error && (
        <div role="alert">
          <p className="error-text">{result.error}</p>
          <button type="button" className="btn-secondary" onClick={() => setRefreshKey((k) => k + 1)}>
            Coba lagi
          </button>
        </div>
      )}

      {showResult && items.length === 0 && (
        <p className="empty">
          {isFiltering
            ? 'Tidak ada bahan yang cocok dengan pencarian atau filter ini.'
            : 'Belum ada bahan. Tambahkan bahan pertamamu untuk mulai menghitung modal.'}
        </p>
      )}

      {showResult && items.length > 0 && (
        <ul className="ingredient-list">
          {items.map((item) => (
            <li key={item.id} className="ingredient-card">
              <div className="ingredient-main">
                {item.image_url && (
                  <img className="thumb" src={item.image_url} alt={`Gambar ${item.name}`} />
                )}
                <div className="ingredient-info">
                  <strong>{item.name}</strong>
                  {item.category_name && <span className="category-badge">{item.category_name}</span>}
                  <span>
                    {formatRupiah(item.purchase_price)} per {item.purchase_qty} {item.purchase_unit}
                  </span>
                  <span className="muted">
                    {formatRupiah(item.price_per_base)} per {getBaseUnit(item.purchase_unit)}
                  </span>
                </div>
              </div>
              <div className="ingredient-actions">
                <button type="button" className="btn-secondary" onClick={() => openEdit(item)}>
                  Ubah
                </button>
                <button type="button" className="btn-secondary" onClick={() => toggleHistory(item)}>
                  {historyId === item.id ? 'Tutup riwayat' : 'Riwayat harga'}
                </button>
                <button type="button" className="btn-danger" onClick={() => handleDelete(item)}>
                  Hapus
                </button>
              </div>

              {historyId === item.id && (
                <div className="history">
                  {historyLoading && <p>Memuat riwayat...</p>}
                  {!historyLoading && history.length === 0 && <p>Belum ada riwayat.</p>}
                  {!historyLoading && history.length > 0 && (
                    <ul>
                      {history.map((row) => (
                        <li key={row.id}>
                          {formatDate(row.recorded_at)}: {formatRupiah(row.purchase_price)} per{' '}
                          {row.purchase_qty} {row.purchase_unit}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {showResult && meta && meta.totalRows > 0 && (
        <div className="pagination-area">
          <p className="muted">
            Halaman {meta.currentPage} dari {meta.totalPages} ({meta.totalRows} bahan)
          </p>
          {meta.totalPages > 1 && (
            <nav className="pagination" aria-label="Navigasi halaman">
              <button
                type="button"
                className="btn-secondary"
                disabled={meta.currentPage <= 1}
                onClick={() => setPage(meta.currentPage - 1)}
              >
                Sebelumnya
              </button>
              {buildPageItems(meta.currentPage, meta.totalPages).map((item, index) =>
                item === '…' ? (
                  <span key={`jeda-${index}`} className="muted">
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    className="btn-secondary page-number"
                    aria-current={item === meta.currentPage ? 'page' : undefined}
                    onClick={() => setPage(item)}
                  >
                    {item}
                  </button>
                )
              )}
              <button
                type="button"
                className="btn-secondary"
                disabled={meta.currentPage >= meta.totalPages}
                onClick={() => setPage(meta.currentPage + 1)}
              >
                Berikutnya
              </button>
            </nav>
          )}
        </div>
      )}
    </main>
  )
}