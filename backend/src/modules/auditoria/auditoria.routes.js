const express = require('express');
const auditoriaController = require('./auditoria.controller');
const authenticateToken = require('../../middlewares/auth.middleware');
const authorizeRoles = require('../../middlewares/role.middleware');
const { USER_ROLES } = require('../../constants/roles');

const router = express.Router();

/**
 * @openapi
 * /auditoria:
 *   get:
 *     tags: [Auditoria]
 *     summary: Lista la bitacora de acciones sensibles
 *     description: >
 *       Requiere rol ADMIN. Registra acciones como forzar el estado de un pedido,
 *       cancelar un pedido, anular un pago, resolver una reclamacion o actualizar/
 *       desactivar un usuario.
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/PageSizeParam'
 *     responses:
 *       200:
 *         description: Bitacora de auditoria
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Audit log retrieved successfully }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/AuditLog' }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/', authenticateToken, authorizeRoles(USER_ROLES.ADMIN), auditoriaController.list);

module.exports = router;
