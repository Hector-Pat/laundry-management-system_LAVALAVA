import api from './api'

export function getPedidos(params) {
  return api.get('/api/pedidos', { params }).then((res) => res.data)
}

export function getMisPedidos(params) {
  return api.get('/api/pedidos/mias', { params }).then((res) => res.data)
}

export function getPedidoById(id) {
  return api.get(`/api/pedidos/${id}`).then((res) => res.data.data)
}

export function createPedido(payload) {
  return api.post('/api/pedidos', payload).then((res) => res.data.data)
}

export function updatePedidoStatus(id, status) {
  return api.patch(`/api/pedidos/${id}/estado`, { status }).then((res) => res.data.data)
}

export function cancelPedido(id, reason) {
  return api.patch(`/api/pedidos/${id}/cancelar`, { reason }).then((res) => res.data.data)
}

export function updatePedidoItems(id, items) {
  return api.put(`/api/pedidos/${id}/items`, { items }).then((res) => res.data.data)
}
