const express = require('express');
const serviciosController = require('./servicios.controller');
const authenticateToken = require('../../middlewares/auth.middleware');
const authorizeRoles = require('../../middlewares/role.middleware');
const { USER_ROLES } = require('../../constants/roles');

const router = express.Router();

router.use(authenticateToken);

/**
 * @openapi
 * /servicios:
 *   get:
 *     tags: [Servicios]
 *     summary: Lista los servicios activos
 *     description: Requiere rol RECEPCIONISTA o ADMIN. Usado al capturar un pedido.
 *     responses:
 *       200:
 *         description: Servicios activos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Servicios retrieved successfully }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Servicio' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   post:
 *     tags: [Servicios]
 *     summary: Crea un servicio
 *     description: Requiere rol ADMIN.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateServicioRequest'
 *     responses:
 *       201:
 *         description: Servicio creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Servicio created successfully }
 *                 data: { $ref: '#/components/schemas/Servicio' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.get('/', authorizeRoles(USER_ROLES.RECEPCIONISTA, USER_ROLES.ADMIN), serviciosController.list);

/**
 * @openapi
 * /servicios/admin:
 *   get:
 *     tags: [Servicios]
 *     summary: Lista todos los servicios (activos e inactivos)
 *     description: Requiere rol ADMIN. Usado en la pantalla de administracion del catalogo.
 *     responses:
 *       200:
 *         description: Todos los servicios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Servicios retrieved successfully }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Servicio' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/admin', authorizeRoles(USER_ROLES.ADMIN), serviciosController.listAll);

router.post('/', authorizeRoles(USER_ROLES.ADMIN), serviciosController.create);

/**
 * @openapi
 * /servicios/{id}:
 *   patch:
 *     tags: [Servicios]
 *     summary: Actualiza un servicio
 *     description: Requiere rol ADMIN. Todos los campos son opcionales.
 *     parameters:
 *       - $ref: '#/components/parameters/ServicioId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateServicioRequest'
 *     responses:
 *       200:
 *         description: Servicio actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Servicio updated successfully }
 *                 data: { $ref: '#/components/schemas/Servicio' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.patch('/:id', authorizeRoles(USER_ROLES.ADMIN), serviciosController.update);

module.exports = router;
