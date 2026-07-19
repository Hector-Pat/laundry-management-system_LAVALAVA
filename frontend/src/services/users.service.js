import api from './api'

export function getUsers() {
  return api.get('/api/users').then((res) => res.data.data)
}

export function updateUser(id, payload) {
  return api.patch(`/api/users/${id}`, payload).then((res) => res.data.data)
}

export function deactivateUser(id) {
  return api.delete(`/api/users/${id}`).then((res) => res.data.data)
}
