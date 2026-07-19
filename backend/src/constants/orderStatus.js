const { USER_ROLES } = require('./roles');

const ORDER_STATUSES = Object.freeze({
    RECIBIDO: 'RECIBIDO',
    LAVADO: 'LAVADO',
    SECADO: 'SECADO',
    PLANCHADO: 'PLANCHADO',
    LISTO: 'LISTO',
    ENTREGADO: 'ENTREGADO'
});

const ORDER_STATUS_VALUES = Object.values(ORDER_STATUSES);

// Maquina de estados lineal: de cada estado solo se puede avanzar al
// siguiente, y solo los roles listados pueden hacerlo. ADMIN puede forzar
// cualquier estado valido como excepcion (correcciones), ver pedidos.service.js.
const ORDER_TRANSITIONS = Object.freeze({
    RECIBIDO: { next: ORDER_STATUSES.LAVADO, roles: [USER_ROLES.OPERADOR] },
    LAVADO: { next: ORDER_STATUSES.SECADO, roles: [USER_ROLES.OPERADOR] },
    SECADO: { next: ORDER_STATUSES.PLANCHADO, roles: [USER_ROLES.OPERADOR] },
    PLANCHADO: { next: ORDER_STATUSES.LISTO, roles: [USER_ROLES.OPERADOR] },
    LISTO: { next: ORDER_STATUSES.ENTREGADO, roles: [USER_ROLES.RECEPCIONISTA] }
});

module.exports = {
    ORDER_STATUSES,
    ORDER_STATUS_VALUES,
    ORDER_TRANSITIONS
};
