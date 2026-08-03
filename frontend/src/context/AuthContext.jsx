import { useState } from 'react'
import api from '../services/api'
import { AuthContext } from './auth-context'

function getStoredUser() {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser)

  const login = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  // El token vive en una cookie httpOnly que el JS de esta app no puede
  // borrar: hay que pedirle al backend que la limpie. No se espera la
  // respuesta para no bloquear la navegacion a /login.
  const logout = () => {
    api.post('/api/auth/logout').catch(() => {})
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
