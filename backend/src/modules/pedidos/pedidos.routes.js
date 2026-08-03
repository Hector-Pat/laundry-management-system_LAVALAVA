const express = require('express');
const pedidosController = require('./pedidos.controller');
const pagosController = require('../pagos/pagos.controller');
const reclamacionesController = require('../reclamaciones/reclamaciones.controller');
const authenticateToken = require('../../middlewares/auth.middleware');
const authorizeRoles = require('../../middlewares/role.middleware');
const { USER_ROLES } = require('../../constants/roles');

const router = express.Router();

router.use(authenticateToken);

router.post(
    '/',
    authorizeRoles(USER_ROLES.RECEPCIONISTA, USER_ROLES.ADMIN),
    pedidosController.create
);

router.get(
    '/',
    authorizeRoles(USER_ROLES.RECEPCIONISTA, USER_ROLES.OPERADOR, USER_ROLES.ADMIN),
    pedidosController.list
);

router.get(
    '/:id',
    authorizeRoles(USER_ROLES.RECEPCIONISTA, USER_ROLES.OPERADOR, USER_ROLES.ADMIN),
    pedidosController.getById
);

// El rol exacto permitido depende del estado actual del pedido (ver
// ORDER_TRANSITIONS), asi que aqui solo se descarta a CLIENT y la
// validacion fina queda en pedidos.service.js.
router.patch(
    '/:id/estado',
    authorizeRoles(USER_ROLES.RECEPCIONISTA, USER_ROLES.OPERADOR, USER_ROLES.ADMIN),
    pedidosController.updateStatus
);

// Cancelar pedido: no reembolsa pagos automaticamente, ver comentario en
// pedidos.service.js::cancelPedido.
router.patch(
    '/:id/cancelar',
    authorizeRoles(USER_ROLES.RECEPCIONISTA, USER_ROLES.ADMIN),
    pedidosController.cancel
);

// Pagos (RF-06): solo quien cobra en mostrador registra o consulta el
// desglose de pagos/saldo de un pedido.
router.get(
    '/:id/pagos',
    authorizeRoles(USER_ROLES.RECEPCIONISTA, USER_ROLES.ADMIN),
    pagosController.list
);

router.post(
    '/:id/pagos',
    authorizeRoles(USER_ROLES.RECEPCIONISTA, USER_ROLES.ADMIN),
    pagosController.create
);

// Daños/reclamaciones (RF-09): cualquier miembro de piso puede reportar uno,
// ya sea al recibir el pedido o al detectarlo durante el proceso.
router.get(
    '/:id/reclamaciones',
    authorizeRoles(USER_ROLES.RECEPCIONISTA, USER_ROLES.OPERADOR, USER_ROLES.ADMIN),
    reclamacionesController.list
);

router.post(
    '/:id/reclamaciones',
    authorizeRoles(USER_ROLES.RECEPCIONISTA, USER_ROLES.OPERADOR, USER_ROLES.ADMIN),
    reclamacionesController.create
);

module.exports = router;
