import api from './api'

export function getAuditLog(params) {
  return api.get('/api/auditoria', { params }).then((res) => res.data)
}
