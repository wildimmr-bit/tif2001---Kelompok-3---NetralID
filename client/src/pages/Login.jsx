import { useState } from 'react'
import { Link } from 'react-router-dom'
import FormInput from '../components/FormInput'
import { validateEmail, validatePassword } from '../utils/validation'
import { loginUser } from '../services/authService'

function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
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
      email: validateEmail(form.email),
      password: validatePassword(form.password),
    }
    setErrors(newErrors)

    if (newErrors.email || newErrors.password) {
      setFeedback({ type: '', text: '' })
      return
    }

    setLoading(true)
    setFeedback({ type: '', text: '' })
    try {
      const data = await loginUser({
        email: form.email.trim(),
        password: form.password,
      })
      setFeedback({ type: 'success', text: data.message || 'Login berhasil' })
    } catch (error) {
      setFeedback({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Masuk</h1>
        <p className="text-sm text-gray-500 mb-6">
          Masuk ke akun Hitungin Anda
        </p>

        <form onSubmit={handleSubmit} noValidate>
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

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Memproses...' : 'Masuk'}
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
          Belum punya akun?{' '}
          <Link to="/register" className="text-blue-600 hover:underline">
            Daftar
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login