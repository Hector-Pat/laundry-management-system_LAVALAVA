import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { UserCheck, Shirt, Eye, EyeOff } from 'lucide-react'
import api from '../../services/api'
import './RegisterPage.css'

const ROLES = [
  { role: 'RECEPCIONISTA', label: 'Recepcionista', Icon: UserCheck, description: 'Atención al cliente' },
  { role: 'OPERADOR',      label: 'Operador',       Icon: Shirt,      description: 'Estados de prendas' },
]

function PasswordField({ id, label, placeholder, error, registration }) {
  const [show, setShow] = useState(false)
  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      <div className="password-wrapper">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          className="form-input"
          placeholder={placeholder}
          {...registration}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && <span className="form-error">{error}</span>}
    </div>
  )
}

function RegisterPage() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useForm({ mode: 'onChange' })

  const password = watch('password')
  const selectedRole = watch('role')

  const onSubmit = async ({ fullName, email, password, role }) => {
    setServerError('')
    try {
      await api.post('/api/auth/register', { fullName, email, password, role })
      navigate('/login', { state: { registered: true } })
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al crear la cuenta'
      setServerError(msg)
    }
  }

  return (
    <div className="register-container">
      <div className="register-card glass-panel">
        <div className="register-header">
          <div className="register-logo">💧</div>
          <h1>Crear cuenta</h1>
          <p>Sistema de gestión de lavandería y tintorería</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="register-form">
          <div className="form-group">
            <label htmlFor="fullName">Nombre completo</label>
            <input
              id="fullName"
              type="text"
              className="form-input"
              placeholder="Ej. María González"
              {...register('fullName', {
                required: 'El nombre es obligatorio',
                minLength: { value: 3, message: 'Mínimo 3 caracteres' },
              })}
            />
            {errors.fullName && <span className="form-error">{errors.fullName.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="correo@ejemplo.com"
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

          <PasswordField
            id="password"
            label="Contraseña"
            placeholder="Mínimo 6 caracteres"
            error={errors.password?.message}
            registration={register('password', {
              required: 'La contraseña es obligatoria',
              minLength: { value: 6, message: 'Mínimo 6 caracteres' },
            })}
          />

          <PasswordField
            id="confirmPassword"
            label="Confirmar contraseña"
            placeholder="Repite tu contraseña"
            error={errors.confirmPassword?.message}
            registration={register('confirmPassword', {
              required: 'Confirma tu contraseña',
              validate: (v) => v === password || 'Las contraseñas no coinciden',
            })}
          />

          <div className="form-group">
            <label>Rol en el sistema</label>
            <input type="hidden" {...register('role', { required: 'Selecciona un rol' })} />
            <div className="role-grid">
              {ROLES.map(({ role, label, Icon, description }) => (
                <button
                  key={role}
                  type="button"
                  className={`role-card ${selectedRole === role ? 'selected' : ''}`}
                  onClick={() => setValue('role', role, { shouldValidate: true })}
                >
                  <Icon size={28} strokeWidth={1.5} />
                  <span className="role-card-label">{label}</span>
                  <span className="role-card-desc">{description}</span>
                </button>
              ))}
            </div>
            {errors.role && <span className="form-error">{errors.role.message}</span>}
          </div>

          {serverError && <p className="register-server-error">{serverError}</p>}

          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="btn-primary register-btn"
          >
            {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <div className="register-footer">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="register-link">
            Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
