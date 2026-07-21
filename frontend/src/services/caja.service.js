import api from './api'

export function getCorteCaja(date) {
  return api.get('/api/caja/corte', { params: date ? { date } : undefined }).then((res) => res.data.data)
}

export function createGasto(payload) {
  return api.post('/api/caja/gastos', payload).then((res) => res.data.data)
}
