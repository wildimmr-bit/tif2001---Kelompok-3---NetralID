import { useCallback, useEffect, useState } from 'react'
import {
  clearToken,
  createIngredient,
  deleteIngredient,
  getIngredientHistory,
  listIngredients,
  updateIngredient,
} from '../services/ingredientService'
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
import './Ingredients.css'

const emptyForm = { name: '', unit: '', qty: '', price: '' }

const handleUnauthorized = () => {
  clearToken()
  window.location.assign('/login')
}

const formatDate = (value) =>
  new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

export default function Ingredients() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [notice, setNotice] = useState('')
  const [actionError, setActionError] = useState('')

  const [form, setForm] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const [historyId, setHistoryId] = useState(null)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const fetchItems = useCallback(async () => {
    try {
      setItems(await listIngredients())
      setLoadError('')
    } catch (err) {
      if (err.status === 401) {
        handleUnauthorized()
        return
      }
      setLoadError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Pemuatan awal. Pembaruan sesudah simpan, hapus, atau coba lagi memakai fetchItems.
  useEffect(() => {
    let cancelled = false
    listIngredients()
      .then((data) => {
        if (!cancelled) setItems(data)
      })
      .catch((err) => {
        if (cancelled) return
        if (err.status === 401) {
          handleUnauthorized()
          return
        }
        setLoadError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const retry = () => {
    setLoading(true)
    setLoadError('')
    fetchItems()
  }

  const openNew = () => {
    setEditingId(null)
    setForm(emptyForm)
    setFieldErrors({})
    setFormError('')
    setNotice('')
  }

  const openEdit = (item) => {
    setEditingId(item.id)
    setForm({
      name: item.name,
      unit: item.purchase_unit,
      qty: String(item.purchase_qty),
      price: String(item.purchase_price),
    })
    setFieldErrors({})
    setFormError('')
    setNotice('')
  }

  const closeForm = () => {
    setForm(null)
    setEditingId(null)
  }

  const updateField = (field) => (event) => setForm({ ...form, [field]: event.target.value })

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
    }
    const wasEditing = Boolean(editingId)

    setSaving(true)
    try {
      if (wasEditing) {
        await updateIngredient(editingId, payload)
      } else {
        await createIngredient(payload)
      }
      closeForm()
      setNotice(wasEditing ? 'Bahan berhasil diperbarui' : 'Bahan berhasil ditambahkan')
      await fetchItems()
    } catch (err) {
      if (err.status === 401) {
        handleUnauthorized()
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
      await fetchItems()
    } catch (err) {
      if (err.status === 401) {
        handleUnauthorized()
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
        handleUnauthorized()
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

  return (
    <main className="ingredients-page">
      <header className="ingredients-header">
        <h1>Bahan</h1>
        {!form && (
          <button type="button" className="btn-primary" onClick={openNew}>
            Tambah bahan
          </button>
        )}
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

      {loading && <p>Memuat bahan...</p>}

      {!loading && loadError && (
        <div role="alert">
          <p className="error-text">{loadError}</p>
          <button type="button" className="btn-secondary" onClick={retry}>
            Coba lagi
          </button>
        </div>
      )}

      {!loading && !loadError && items.length === 0 && (
        <p className="empty">Belum ada bahan. Tambahkan bahan pertamamu untuk mulai menghitung modal.</p>
      )}

      {!loading && !loadError && items.length > 0 && (
        <ul className="ingredient-list">
          {items.map((item) => (
            <li key={item.id} className="ingredient-card">
              <div className="ingredient-info">
                <strong>{item.name}</strong>
                <span>
                  {formatRupiah(item.purchase_price)} per {item.purchase_qty} {item.purchase_unit}
                </span>
                <span className="muted">
                  {formatRupiah(item.price_per_base)} per {getBaseUnit(item.purchase_unit)}
                </span>
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
    </main>
  )
}