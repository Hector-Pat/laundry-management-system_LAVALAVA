const express = require('express');
const auditoriaController = require('./auditoria.controller');
const authenticateToken = require('../../middlewares/auth.middleware');
const authorizeRoles = require('../../middlewares/role.middleware');
const { USER_ROLES } = require('../../constants/roles');

const router = express.Router();

router.get('/', authenticateToken, authorizeRoles(USER_ROLES.ADMIN), auditoriaController.list);

module.exports = router;
