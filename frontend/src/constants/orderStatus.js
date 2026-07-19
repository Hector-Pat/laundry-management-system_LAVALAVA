export const ORDER_STATUS_LABELS = {
  RECIBIDO: 'Recibido',
  LAVADO: 'Lavado',
  SECADO: 'Secado',
  PLANCHADO: 'Planchado',
  LISTO: 'Listo',
  ENTREGADO: 'Entregado',
}

export const ORDER_STATUS_VALUES = Object.keys(ORDER_STATUS_LABELS)

export const ORDER_STATUS_COLORS = {
  RECIBIDO: 'bg-gray-100 text-gray-600',
  LAVADO: 'bg-blue-50 text-blue-600',
  SECADO: 'bg-amber-50 text-amber-600',
  PLANCHADO: 'bg-purple-50 text-purple-600',
  LISTO: 'bg-green-50 text-green-600',
  ENTREGADO: 'bg-indigo-50 text-indigo-600',
}

// Espejo, solo para UI, de ORDER_TRANSITIONS en el backend (decide que
// boton de "avanzar" mostrar segun el rol). El backend vuelve a validar
// cada cambio de estado; esto no es la fuente de verdad.
export const ORDER_TRANSITIONS = {
  RECIBIDO: { next: 'LAVADO', roles: ['OPERADOR'] },
  LAVADO: { next: 'SECADO', roles: ['OPERADOR'] },
  SECADO: { next: 'PLANCHADO', roles: ['OPERADOR'] },
  PLANCHADO: { next: 'LISTO', roles: ['OPERADOR'] },
  LISTO: { next: 'ENTREGADO', roles: ['RECEPCIONISTA'] },
}
