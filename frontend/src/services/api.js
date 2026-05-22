const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export async function fetchAPI(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}
