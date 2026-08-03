import { LayoutDashboard, Package, Users, Settings, Wallet, Shirt } from 'lucide-react'

export function getNavLinks(role) {
  const links = [
    { icon: <LayoutDashboard size={18} />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Package size={18} />, label: 'Pedidos', path: '/pedidos' },
    { icon: <Users size={18} />, label: 'Clientes', path: '/clientes' },
  ]

  if (role === 'RECEPCIONISTA' || role === 'ADMIN') {
    links.push({ icon: <Wallet size={18} />, label: 'Caja', path: '/caja' })
  }

  if (role === 'ADMIN') {
    links.push({ icon: <Shirt size={18} />, label: 'Servicios', path: '/servicios' })
    links.push({ icon: <Settings size={18} />, label: 'Admin', path: '/admin' })
  }

  return links
}
