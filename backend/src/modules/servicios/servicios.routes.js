const express = require('express');
const serviciosController = require('./servicios.controller');
const authenticateToken = require('../../middlewares/auth.middleware');
const authorizeRoles = require('../../middlewares/role.middleware');
const { USER_ROLES } = require('../../constants/roles');

const router = express.Router();

router.use(authenticateToken);

router.get('/', authorizeRoles(USER_ROLES.RECEPCIONISTA, USER_ROLES.ADMIN), serviciosController.list);
router.get('/admin', authorizeRoles(USER_ROLES.ADMIN), serviciosController.listAll);
router.post('/', authorizeRoles(USER_ROLES.ADMIN), serviciosController.create);
router.patch('/:id', authorizeRoles(USER_ROLES.ADMIN), serviciosController.update);

module.exports = router;
