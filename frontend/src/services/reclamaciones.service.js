import api from './api'

export function getReclamaciones(pedidoId) {
  return api.get(`/api/pedidos/${pedidoId}/reclamaciones`).then((res) => res.data.data)
}

export function registerReclamacion(pedidoId, payload) {
  return api.post(`/api/pedidos/${pedidoId}/reclamaciones`, payload).then((res) => res.data.data)
}
