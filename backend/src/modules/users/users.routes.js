const express = require('express');
const usersController = require('./users.controller');
const authenticateToken = require('../../middlewares/auth.middleware');
const authorizeRoles = require('../../middlewares/role.middleware');
const { USER_ROLES } = require('../../constants/roles');

const router = express.Router();

router.use(authenticateToken, authorizeRoles(USER_ROLES.ADMIN));

/**
 * @openapi
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: Lista todas las cuentas de usuario
 *     description: Requiere rol ADMIN.
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Users retrieved successfully }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/User' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   post:
 *     tags: [Users]
 *     summary: Crea una cuenta de usuario (cualquier rol)
 *     description: Requiere rol ADMIN. A diferencia de /auth/register, puede crear cuentas de personal (ADMIN, RECEPCIONISTA, OPERADOR) ademas de CLIENT.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *     responses:
 *       201:
 *         description: Usuario creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: User created successfully }
 *                 data: { $ref: '#/components/schemas/User' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.get('/', usersController.list);
router.post('/', usersController.create);

/**
 * @openapi
 * /users/{id}:
 *   patch:
 *     tags: [Users]
 *     summary: Actualiza rol, estado o contrasena de un usuario
 *     description: >
 *       Requiere rol ADMIN. Un ADMIN no puede cambiar su propio rol ni desactivar su propia cuenta.
 *       Solo se envian los campos que cambian.
 *     parameters:
 *       - $ref: '#/components/parameters/UserId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: User updated successfully }
 *                 data: { $ref: '#/components/schemas/User' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Users]
 *     summary: Desactiva (soft delete) a un usuario
 *     description: Requiere rol ADMIN. Un ADMIN no puede desactivar su propia cuenta.
 *     parameters:
 *       - $ref: '#/components/parameters/UserId'
 *     responses:
 *       200:
 *         description: Usuario desactivado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: User deactivated successfully }
 *                 data: { $ref: '#/components/schemas/User' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id', usersController.update);
router.delete('/:id', usersController.remove);

module.exports = router;
