import { Navigate } from 'react-router-dom'

// Halaman yang dibungkus komponen ini hanya bisa dibuka bila token tersimpan.
// Keabsahan token tetap diperiksa server: bila ditolak (401), halaman bahan mengarahkan ke login.
export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return children
}