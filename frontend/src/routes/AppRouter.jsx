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
import ClienteDetailPage from '../pages/clientes/ClienteDetailPage'
import PedidosPage from '../pages/pedidos/PedidosPage'
import PedidoFormPage from '../pages/pedidos/PedidoFormPage'
import PedidoDetailPage from '../pages/pedidos/PedidoDetailPage'
import CajaPage from '../pages/caja/CajaPage'
import ServiciosPage from '../pages/servicios/ServiciosPage'
import ReclamacionesPage from '../pages/reclamaciones/ReclamacionesPage'
import MisPedidosPage from '../pages/cliente/MisPedidosPage'
import AuditoriaPage from '../pages/auditoria/AuditoriaPage'

const PEDIDOS_STAFF_ROLES = ['RECEPCIONISTA', 'OPERADOR', 'ADMIN']
const PEDIDOS_CREATE_ROLES = ['RECEPCIONISTA', 'ADMIN']
const RECEPCION_ADMIN_ROLES = ['RECEPCIONISTA', 'ADMIN']

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
          <ProtectedRoute roles={RECEPCION_ADMIN_ROLES}>
            <ClientesPage />
          </ProtectedRoute>
        } />
        <Route path="/clientes/:id" element={
          <ProtectedRoute roles={RECEPCION_ADMIN_ROLES}>
            <ClienteDetailPage />
          </ProtectedRoute>
        } />
        <Route path="/pedidos" element={
          <ProtectedRoute roles={PEDIDOS_STAFF_ROLES}>
            <PedidosPage />
          </ProtectedRoute>
        } />
        <Route path="/pedidos/nuevo" element={
          <ProtectedRoute roles={PEDIDOS_CREATE_ROLES}>
            <PedidoFormPage />
          </ProtectedRoute>
        } />
        <Route path="/pedidos/:id/editar" element={
          <ProtectedRoute roles={PEDIDOS_CREATE_ROLES}>
            <PedidoFormPage />
          </ProtectedRoute>
        } />
        <Route path="/pedidos/:id" element={
          <ProtectedRoute roles={PEDIDOS_STAFF_ROLES}>
            <PedidoDetailPage />
          </ProtectedRoute>
        } />
        <Route path="/caja" element={
          <ProtectedRoute roles={RECEPCION_ADMIN_ROLES}>
            <CajaPage />
          </ProtectedRoute>
        } />
        <Route path="/servicios" element={
          <ProtectedRoute roles={['ADMIN']}>
            <ServiciosPage />
          </ProtectedRoute>
        } />
        <Route path="/reclamaciones" element={
          <ProtectedRoute roles={RECEPCION_ADMIN_ROLES}>
            <ReclamacionesPage />
          </ProtectedRoute>
        } />
        <Route path="/mis-pedidos" element={
          <ProtectedRoute roles={['CLIENT']}>
            <MisPedidosPage />
          </ProtectedRoute>
        } />
        <Route path="/auditoria" element={
          <ProtectedRoute roles={['ADMIN']}>
            <AuditoriaPage />
          </ProtectedRoute>
        } />
      </Routes>
    </AuthProvider>
  )
}

export default AppRouter
