import api from './api'

export function getServicios() {
  return api.get('/api/servicios').then((res) => res.data.data)
}
