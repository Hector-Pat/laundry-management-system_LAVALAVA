const express = require('express');
const usersController = require('./users.controller');
const authenticateToken = require('../../middlewares/auth.middleware');
const authorizeRoles = require('../../middlewares/role.middleware');
const { USER_ROLES } = require('../../constants/roles');

const router = express.Router();

router.use(authenticateToken, authorizeRoles(USER_ROLES.ADMIN));

router.get('/', usersController.list);
router.patch('/:id', usersController.update);
router.delete('/:id', usersController.remove);

module.exports = router;
