import api from './api'

export function getPagos(pedidoId) {
  return api.get(`/api/pedidos/${pedidoId}/pagos`).then((res) => res.data.data)
}

export function registerPago(pedidoId, payload) {
  return api.post(`/api/pedidos/${pedidoId}/pagos`, payload).then((res) => res.data.data)
}
