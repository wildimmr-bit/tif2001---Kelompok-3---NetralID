import { useEffect, useState } from 'react'

// Menunda perubahan nilai sampai pengguna berhenti mengetik, supaya server tidak dipanggil di setiap huruf.
export default function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}