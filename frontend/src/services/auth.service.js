import api from './api'

export function changePassword(payload) {
  return api.post('/api/auth/change-password', payload).then((res) => res.data)
}
