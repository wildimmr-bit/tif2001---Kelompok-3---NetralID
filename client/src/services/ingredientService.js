import api from './api'

// Nama kunci token harus sama dengan yang disimpan oleh halaman Login.
const TOKEN_KEY = 'token'

// Dipakai saat sesi berakhir. Login juga menyimpan data pengguna, jadi ikut dihapus.
export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem('user')
}

export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors || {}
  }
}

// Semua permintaan lewat klien api yang sama dengan Login, lalu galatnya diseragamkan menjadi ApiError.
const request = async (config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  try {
    const response = await api.request({
      ...config,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    return response.data
  } catch (err) {
    if (err.response) {
      const body = err.response.data
      throw new ApiError(body?.message || 'Terjadi kesalahan', err.response.status, body?.errors)
    }
    throw new ApiError('Tidak dapat terhubung ke server', 0)
  }
}

export const listIngredients = async () => (await request({ method: 'get', url: '/ingredients' })).data

export const createIngredient = async (payload) =>
  (await request({ method: 'post', url: '/ingredients', data: payload })).data

export const updateIngredient = async (id, payload) =>
  (await request({ method: 'put', url: `/ingredients/${id}`, data: payload })).data

export const deleteIngredient = async (id) => {
  await request({ method: 'delete', url: `/ingredients/${id}` })
}

export const getIngredientHistory = async (id) =>
  (await request({ method: 'get', url: `/ingredients/${id}/history` })).data