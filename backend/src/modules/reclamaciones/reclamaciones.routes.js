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
/**
 * @openapi
 * /reclamaciones:
 *   get:
 *     tags: [Reclamaciones]
 *     summary: Lista todas las reclamaciones (todos los pedidos)
 *     description: >
 *       Requiere rol RECEPCIONISTA o ADMIN. Para dar de alta o resolver una reclamacion
 *       puntual, usa los endpoints anidados bajo /pedidos/{id}/reclamaciones.
 *     parameters:
 *       - name: status
 *         in: query
 *         description: Filtra por estado de la reclamacion
 *         schema: { type: string, enum: [ABIERTA, RESUELTA] }
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/PageSizeParam'
 *     responses:
 *       200:
 *         description: Reclamaciones encontradas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Reclamaciones retrieved successfully }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Reclamacion' }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
    '/',
    authenticateToken,
    authorizeRoles(USER_ROLES.RECEPCIONISTA, USER_ROLES.ADMIN),
    reclamacionesController.listAll
);

module.exports = router;
