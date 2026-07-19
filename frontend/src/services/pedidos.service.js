import api from './api'

export function getPedidos(params) {
  return api.get('/api/pedidos', { params }).then((res) => res.data)
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
