import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import FormInput from '../../components/ui/FormInput'
import PasswordInput from '../../components/ui/PasswordInput'

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
    const mockUser = { email, role: 'admin' }
    login(mockUser)
    navigate(ROLE_ROUTES[mockUser.role])
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Bienvenido</h1>
          <p className="text-sm text-gray-500">Sistema de gestión de lavandería y tintorería</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <FormInput
            label="Correo electrónico"
            type="email"
            placeholder="correo@ejemplo.com"
            error={errors.email?.message}
            {...register('email', {
              required: 'El correo es obligatorio',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Ingresa un correo válido',
              },
            })}
          />

          <PasswordInput
            label="Contraseña"
            placeholder="Tu contraseña"
            error={errors.password?.message}
            {...register('password', {
              required: 'La contraseña es obligatoria',
              minLength: { value: 8, message: 'Mínimo 8 caracteres' },
            })}
          />

          <button
            type="submit"
            disabled={!isValid}
            className="w-full rounded-xl bg-indigo-600 py-3 text-base font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Entrar
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:underline">
            Crear cuenta
          </Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
