import api from './api'

export function searchClientes(search) {
  return api.get('/api/clientes', { params: { search } }).then((res) => res.data.data)
}
