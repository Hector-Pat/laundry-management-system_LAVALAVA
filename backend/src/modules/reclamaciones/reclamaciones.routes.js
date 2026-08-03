const express = require('express');
const reclamacionesController = require('./reclamaciones.controller');
const authenticateToken = require('../../middlewares/auth.middleware');
const authorizeRoles = require('../../middlewares/role.middleware');
const { USER_ROLES } = require('../../constants/roles');

const router = express.Router();

// Listado global (todas las reclamaciones, no solo las de un pedido) para
// que RECEPCIONISTA/ADMIN puedan dar seguimiento sin buscar pedido por
// pedido. El alta y la resolucion de una reclamacion puntual siguen
// viviendo bajo /api/pedidos/:id/reclamaciones (ver pedidos.routes.js).
router.get(
    '/',
    authenticateToken,
    authorizeRoles(USER_ROLES.RECEPCIONISTA, USER_ROLES.ADMIN),
    reclamacionesController.listAll
);

module.exports = router;
