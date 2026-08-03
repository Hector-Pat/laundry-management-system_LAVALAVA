const express = require('express');
const clientesController = require('./clientes.controller');
const authenticateToken = require('../../middlewares/auth.middleware');
const authorizeRoles = require('../../middlewares/role.middleware');
const { USER_ROLES } = require('../../constants/roles');

const router = express.Router();

router.use(authenticateToken, authorizeRoles(USER_ROLES.RECEPCIONISTA, USER_ROLES.ADMIN));

router.get('/', clientesController.list);
router.get('/:id', clientesController.getById);
router.post('/', clientesController.create);
router.patch('/:id', clientesController.update);

module.exports = router;
