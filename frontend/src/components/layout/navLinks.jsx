import { LayoutDashboard, Package, Users, Settings } from 'lucide-react'

export function getNavLinks(role) {
  const links = [
    { icon: <LayoutDashboard size={18} />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Package size={18} />, label: 'Pedidos', path: '/pedidos' },
    { icon: <Users size={18} />, label: 'Clientes', path: '/clientes' },
  ]

  if (role === 'ADMIN') {
    links.push({ icon: <Settings size={18} />, label: 'Admin', path: '/admin' })
  }

  return links
}
