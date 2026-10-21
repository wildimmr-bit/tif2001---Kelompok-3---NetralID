import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
})

// Endpoint di bawah masih placeholder. Sesuaikan dengan
// route dari branch feat/server-auth-jwt (Mhs 2).
export const registerUser = async (data) => {
  const response = await api.post('/auth/register', data)
  return response.data
}

export const loginUser = async (data) => {
  const response = await api.post('/auth/login', data)
  return response.data
}