const express = require('express');
const cajaController = require('./caja.controller');
const authenticateToken = require('../../middlewares/auth.middleware');
const authorizeRoles = require('../../middlewares/role.middleware');
const { USER_ROLES } = require('../../constants/roles');

const router = express.Router();

router.use(authenticateToken, authorizeRoles(USER_ROLES.RECEPCIONISTA, USER_ROLES.ADMIN));

router.get('/corte', cajaController.corte);
router.get('/reporte', cajaController.reporte);
router.get('/gastos', cajaController.listGastos);
router.post('/gastos', cajaController.createGasto);

module.exports = router;
