import api from './api'

const getErrorMessage = (error, fallback) => {
  if (error.response && error.response.data && error.response.data.message) {
    return error.response.data.message
  }
  if (error.request) {
    return 'Tidak dapat terhubung ke server. Coba lagi nanti.'
  }
  return fallback
}

export const registerUser = async ({ name, email, password }) => {
  try {
    const response = await api.post('/auth/register', { name, email, password })
    return response.data
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Registrasi gagal'), { cause: error })
  }
}

export const loginUser = async ({ email, password }) => {
  let response
  try {
    response = await api.post('/auth/login', { email, password })
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Login gagal'), { cause: error })
  }

  localStorage.setItem('token', response.data.token)
  localStorage.setItem('user', JSON.stringify(response.data.user))
  return response.data
}