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
  CLIENT: '/dashboard',
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
          <h1>Welcome to LAVALAVA</h1>
          <p>Sign in to manage your laundry operations</p>
        </div>

        {state?.registered && (
          <p className="login-success">Cuenta creada. Iniciá sesión.</p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="name@example.com"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Enter a valid email address',
                },
              })}
            />
            {errors.email && <span className="form-error">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Minimum 6 characters' },
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
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          Don't have an account?{' '}
          <Link to="/register" className="login-link">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
