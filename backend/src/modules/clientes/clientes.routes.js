const express = require('express');
const clientesController = require('./clientes.controller');
const authenticateToken = require('../../middlewares/auth.middleware');
const authorizeRoles = require('../../middlewares/role.middleware');
const { USER_ROLES } = require('../../constants/roles');

const router = express.Router();

router.use(authenticateToken, authorizeRoles(USER_ROLES.RECEPCIONISTA, USER_ROLES.ADMIN));

/**
 * @openapi
 * /clientes:
 *   get:
 *     tags: [Clientes]
 *     summary: Lista o busca clientes
 *     description: >
 *       Si se envia `search`, hace un autocomplete (limite de 20 resultados, sin paginacion),
 *       usado en el formulario de pedidos. Si no, devuelve el listado paginado usado en la
 *       pantalla de gestion de clientes.
 *     parameters:
 *       - name: search
 *         in: query
 *         description: Texto de busqueda (autocomplete). Minimo 2 caracteres.
 *         schema: { type: string, minLength: 2 }
 *       - name: cliente
 *         in: query
 *         description: Filtro de nombre/telefono para el listado paginado (ignorado si se envia `search`).
 *         schema: { type: string }
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/PageSizeParam'
 *     responses:
 *       200:
 *         description: Clientes encontrados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Clientes retrieved successfully }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Cliente' }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   post:
 *     tags: [Clientes]
 *     summary: Da de alta un cliente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateClienteRequest'
 *     responses:
 *       201:
 *         description: Cliente creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Cliente created successfully }
 *                 data: { $ref: '#/components/schemas/Cliente' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/', clientesController.list);
router.post('/', clientesController.create);

/**
 * @openapi
 * /clientes/{id}:
 *   get:
 *     tags: [Clientes]
 *     summary: Obtiene un cliente por id
 *     parameters:
 *       - $ref: '#/components/parameters/ClienteId'
 *     responses:
 *       200:
 *         description: Cliente encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Cliente retrieved successfully }
 *                 data: { $ref: '#/components/schemas/Cliente' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   patch:
 *     tags: [Clientes]
 *     summary: Actualiza datos de un cliente
 *     parameters:
 *       - $ref: '#/components/parameters/ClienteId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateClienteRequest'
 *     responses:
 *       200:
 *         description: Cliente actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Cliente updated successfully }
 *                 data: { $ref: '#/components/schemas/Cliente' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', clientesController.getById);
router.patch('/:id', clientesController.update);

module.exports = router;
