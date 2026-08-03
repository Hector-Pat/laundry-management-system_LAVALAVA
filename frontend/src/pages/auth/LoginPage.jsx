import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import api from '../../services/api'
import './LoginPage.css'

const ROLE_ROUTES = {
  ADMIN: '/admin',
  RECEPCIONISTA: '/recepcionista',
  OPERADOR: '/operador',
  CLIENT: '/mis-pedidos',
}

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { state } = useLocation()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm({ mode: 'onChange' })

  const onSubmit = async ({ email, password }) => {
    setServerError('')
    try {
      const { data } = await api.post('/api/auth/login', { email, password })
      const { token, user } = data.data
      login(user, token)
      navigate(ROLE_ROUTES[user.role] ?? '/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al iniciar sesión'
      setServerError(msg)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card glass-panel">
        <div className="login-header">
          <div className="login-logo">💧</div>
          <h1>Bienvenido a LAVALAVA</h1>
          <p>Inicia sesión para gestionar tu lavandería</p>
        </div>

        {state?.registered && (
          <p className="login-success">Cuenta creada. Inicia sesión.</p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="login-form">
          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="nombre@ejemplo.com"
              {...register('email', {
                required: 'El correo es obligatorio',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Ingresa un correo válido',
                },
              })}
            />
            {errors.email && <span className="form-error">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              {...register('password', {
                required: 'La contraseña es obligatoria',
                minLength: { value: 6, message: 'Mínimo 6 caracteres' },
              })}
            />
            {errors.password && <span className="form-error">{errors.password.message}</span>}
          </div>

          {serverError && <p className="form-error">{serverError}</p>}

          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="btn-primary login-btn"
          >
            {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="login-footer">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="login-link">
            Crear una cuenta
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
