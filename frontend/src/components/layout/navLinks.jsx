import { Home, LayoutDashboard, Package, Users, Settings, Wallet, Shirt, ShieldAlert, ScrollText } from 'lucide-react'

// Espejo de ROLE_ROUTES en LoginPage.jsx: la pagina de inicio a la que
// login() redirige a cada rol. A diferencia de ADMIN (que llega a
// /dashboard y tiene ademas su propio link "Admin" a /admin) y CLIENT
// (cuyo unico link ya es su home, /mis-pedidos), RECEPCIONISTA y OPERADOR
// no tenian ningun link de vuelta a su pagina de inicio una vez que
// navegaban a otra pantalla.
const HOME_ROUTES = {
  RECEPCIONISTA: '/recepcionista',
  OPERADOR: '/operador',
}

export function getNavLinks(role) {
  // CLIENT tiene su propio portal: no ve pedidos/clientes de mostrador.
  if (role === 'CLIENT') {
    return [{ icon: <Package size={18} />, label: 'Mis pedidos', path: '/mis-pedidos' }]
  }

  const links = []

  if (HOME_ROUTES[role]) {
    links.push({ icon: <Home size={18} />, label: 'Inicio', path: HOME_ROUTES[role] })
  }

  links.push({ icon: <LayoutDashboard size={18} />, label: 'Dashboard', path: '/dashboard' })

  if (role === 'RECEPCIONISTA' || role === 'OPERADOR' || role === 'ADMIN') {
    links.push({ icon: <Package size={18} />, label: 'Pedidos', path: '/pedidos' })
  }

  if (role === 'RECEPCIONISTA' || role === 'ADMIN') {
    links.push({ icon: <Users size={18} />, label: 'Clientes', path: '/clientes' })
    links.push({ icon: <Wallet size={18} />, label: 'Caja', path: '/caja' })
    links.push({ icon: <ShieldAlert size={18} />, label: 'Reclamaciones', path: '/reclamaciones' })
  }

  if (role === 'ADMIN') {
    links.push({ icon: <Shirt size={18} />, label: 'Servicios', path: '/servicios' })
    links.push({ icon: <ScrollText size={18} />, label: 'Auditoría', path: '/auditoria' })
    links.push({ icon: <Settings size={18} />, label: 'Admin', path: '/admin' })
  }

  return links
}
