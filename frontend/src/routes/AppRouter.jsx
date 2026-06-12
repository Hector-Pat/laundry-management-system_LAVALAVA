import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import ProtectedRoute from './ProtectedRoute'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import AdminPage from '../pages/admin/AdminPage'
import OperadorPage from '../pages/operador/OperadorPage'
import RecepcionistaPage from '../pages/recepcionista/RecepcionistaPage'
import DashboardPage from '../pages/dashboard/DashboardPage'
import ClientesPage from '../pages/clientes/ClientesPage'
import PedidosPage from '../pages/pedidos/PedidosPage'

function AppRouter() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/admin" element={
          <ProtectedRoute roles={['ADMIN']}>
            <AdminPage />
          </ProtectedRoute>
        } />
        <Route path="/operador" element={
          <ProtectedRoute roles={['OPERADOR']}>
            <OperadorPage />
          </ProtectedRoute>
        } />
        <Route path="/recepcionista" element={
          <ProtectedRoute roles={['RECEPCIONISTA']}>
            <RecepcionistaPage />
          </ProtectedRoute>
        } />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/clientes" element={
          <ProtectedRoute>
            <ClientesPage />
          </ProtectedRoute>
        } />
        <Route path="/pedidos" element={
          <ProtectedRoute>
            <PedidosPage />
          </ProtectedRoute>
        } />
      </Routes>
    </AuthProvider>
  )
}

export default AppRouter
