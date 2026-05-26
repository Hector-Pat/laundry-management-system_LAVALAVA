import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import './LoginPage.css'

const ROLE_ROUTES = {
  admin: '/admin',
  operador: '/operador',
  recepcionista: '/recepcionista',
}

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({ mode: 'onChange' })

  const onSubmit = ({ email }) => {
    // Mock auth — replace with loginService() when backend is ready
    const mockUser = { email, role: 'admin', username: email.split('@')[0] }
    login(mockUser)
    navigate('/dashboard') // Route to new dashboard for demonstration
  }

  return (
    <div className="login-container">
      <div className="login-card glass-panel">
        <div className="login-header">
          <div className="login-logo">💧</div>
          <h1>Welcome to LAVALAVA</h1>
          <p>Sign in to manage your laundry operations</p>
        </div>

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
                minLength: { value: 8, message: 'Minimum 8 characters' },
              })}
            />
            {errors.password && <span className="form-error">{errors.password.message}</span>}
          </div>

          <button
            type="submit"
            disabled={!isValid}
            className="btn-primary login-btn"
          >
            Sign In
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
