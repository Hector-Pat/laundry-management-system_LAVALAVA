import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import RoleCard from '../../components/ui/RoleCard'
import FormInput from '../../components/ui/FormInput'
import PasswordInput from '../../components/ui/PasswordInput'

const ROLES = [
  {
    role: 'recepcionista',
    label: 'Recepcionista',
    icon: 'UserCheck',
    description: 'Registro de pedidos y atención al cliente',
  },
  {
    role: 'operador',
    label: 'Operador',
    icon: 'Shirt',
    description: 'Actualización de estados de prendas',
  },
  {
    role: 'admin',
    label: 'Admin',
    icon: 'ShieldCheck',
    description: 'Acceso total al sistema',
  },
]

function RegisterPage() {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm({ mode: 'onChange' })

  const password = watch('password')
  const selectedRole = watch('role')

  const handleRoleSelect = (role) => {
    setValue('role', role, { shouldValidate: true })
  }

  const onSubmit = (data) => {
    // Mock submit — replace with registerService() when backend is ready
    console.log(data)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Crear cuenta</h1>
        <p className="text-sm text-gray-500 mb-6">
          Sistema de gestión de lavandería y tintorería
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <FormInput
            label="Nombre completo"
            type="text"
            placeholder="Ej. María González"
            error={errors.fullName?.message}
            {...register('fullName', {
              required: 'El nombre es obligatorio',
              minLength: { value: 3, message: 'Mínimo 3 caracteres' },
            })}
          />

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
            placeholder="Mínimo 8 caracteres"
            error={errors.password?.message}
            {...register('password', {
              required: 'La contraseña es obligatoria',
              minLength: { value: 8, message: 'Mínimo 8 caracteres' },
            })}
          />

          <PasswordInput
            label="Confirmar contraseña"
            placeholder="Repite tu contraseña"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', {
              required: 'Confirma tu contraseña',
              validate: (v) => v === password || 'Las contraseñas no coinciden',
            })}
          />

          {/* Hidden input keeps react-hook-form in sync with role selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rol en el sistema
            </label>
            <input
              type="hidden"
              {...register('role', { required: 'Selecciona un rol' })}
            />
            <div className="grid grid-cols-3 gap-3">
              {ROLES.map((r) => (
                <RoleCard
                  key={r.role}
                  {...r}
                  selected={selectedRole === r.role}
                  onSelect={handleRoleSelect}
                />
              ))}
            </div>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!isValid}
            className="w-full rounded-xl bg-indigo-600 py-3 text-base font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Crear cuenta
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
