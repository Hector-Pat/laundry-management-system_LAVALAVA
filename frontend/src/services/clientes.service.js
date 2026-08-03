import api from './api'

export function searchClientes(search) {
  return api.get('/api/clientes', { params: { search } }).then((res) => res.data.data)
}

export function getClientes(params) {
  return api.get('/api/clientes', { params }).then((res) => res.data)
}

export function getClienteById(id) {
  return api.get(`/api/clientes/${id}`).then((res) => res.data.data)
}

export function createCliente(payload) {
  return api.post('/api/clientes', payload).then((res) => res.data.data)
}

export function updateCliente(id, payload) {
  return api.patch(`/api/clientes/${id}`, payload).then((res) => res.data.data)
}
