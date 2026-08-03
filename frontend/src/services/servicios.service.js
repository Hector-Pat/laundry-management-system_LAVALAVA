import api from './api'

export function getServicios() {
  return api.get('/api/servicios').then((res) => res.data.data)
}

export function getAllServicios() {
  return api.get('/api/servicios/admin').then((res) => res.data.data)
}

export function createServicio(payload) {
  return api.post('/api/servicios', payload).then((res) => res.data.data)
}

export function updateServicio(id, payload) {
  return api.patch(`/api/servicios/${id}`, payload).then((res) => res.data.data)
}
