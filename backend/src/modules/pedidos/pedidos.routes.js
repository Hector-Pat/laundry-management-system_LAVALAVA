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

module.exports = router;
