export const ORDER_STATUS_LABELS = {
  RECIBIDO: 'Recibido',
  LAVADO: 'Lavado',
  SECADO: 'Secado',
  PLANCHADO: 'Planchado',
  LISTO: 'Listo',
  ENTREGADO: 'Entregado',
}

export const ORDER_STATUS_VALUES = Object.keys(ORDER_STATUS_LABELS)

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
