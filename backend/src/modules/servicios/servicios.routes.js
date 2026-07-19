const express = require('express');
const serviciosController = require('./servicios.controller');
const authenticateToken = require('../../middlewares/auth.middleware');
const authorizeRoles = require('../../middlewares/role.middleware');
const { USER_ROLES } = require('../../constants/roles');

const router = express.Router();

router.use(authenticateToken, authorizeRoles(USER_ROLES.RECEPCIONISTA, USER_ROLES.ADMIN));

router.get('/', serviciosController.list);

module.exports = router;
