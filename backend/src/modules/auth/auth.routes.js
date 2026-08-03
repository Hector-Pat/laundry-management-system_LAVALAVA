const express = require('express');
const authController = require('./auth.controller');
const authenticateToken = require('../../middlewares/auth.middleware');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/change-password', authenticateToken, authController.changePassword);

module.exports = router;
