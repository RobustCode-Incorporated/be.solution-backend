// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Routes publiques pour citoyens
router.post('/register', authController.registerCitoyen);
router.post('/login', authController.loginUser);

module.exports = router;