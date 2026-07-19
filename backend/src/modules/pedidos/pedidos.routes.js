const express = require('express');
const pedidosController = require('./pedidos.controller');
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

module.exports = router;
