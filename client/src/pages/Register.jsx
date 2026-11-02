import { useState } from 'react'
import { Link } from 'react-router-dom'
import FormInput from '../components/FormInput'
import {
  validateName,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
} from '../utils/validation'
import { registerUser } from '../services/authService'

const emptyForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
}

function Register() {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
    setErrors({ ...errors, [name]: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = {
      name: validateName(form.name),
      email: validateEmail(form.email),
      password: validatePassword(form.password),
      confirmPassword: validateConfirmPassword(
        form.password,
        form.confirmPassword
      ),
    }
    setErrors(newErrors)

    const hasError = Object.values(newErrors).some((err) => err)
    if (hasError) {
      setFeedback({ type: '', text: '' })
      return
    }

    setLoading(true)
    setFeedback({ type: '', text: '' })
    try {
      const data = await registerUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      setFeedback({
        type: 'success',
        text: data.message || 'Registrasi berhasil',
      })
      setForm(emptyForm)
    } catch (error) {
      setFeedback({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Daftar</h1>
        <p className="text-sm text-gray-500 mb-6">
          Buat akun Hitungin baru
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <FormInput
            label="Nama Lengkap"
            name="name"
            value={form.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="Nama lengkap Anda"
          />
          <FormInput
            label="Email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="nama@email.com"
          />
          <FormInput
            label="Password"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            placeholder="Minimal 8 karakter"
          />
          <FormInput
            label="Konfirmasi Password"
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            placeholder="Ulangi password"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Memproses...' : 'Daftar'}
          </button>
        </form>

        {feedback.text && (
          <p
            className={`mt-4 text-sm ${
              feedback.type === 'success' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {feedback.text}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register