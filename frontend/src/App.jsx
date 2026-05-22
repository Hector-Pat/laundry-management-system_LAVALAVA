import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'

import Login from './pages/Login/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import Pedidos from './pages/Pedidos/Pedidos'
import Clientes from './pages/Clientes/Clientes'

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pedidos" element={<Pedidos />} />
        <Route path="/clientes" element={<Clientes />} />
      </Routes>
    </div>
  )
}

export default App
