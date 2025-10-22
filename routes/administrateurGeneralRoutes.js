const express = require('express');
const router = express.Router();
const adminGeneralController = require('../controllers/adminGeneralController');
const authMiddleware = require('../middleware/authMiddleware');

// Route création ouverte (ex. pour initialiser un premier admin général)
router.post('/', adminGeneralController.createAdminGeneral);

// Connexion d’un admin général
router.post('/login-admin-general', adminGeneralController.loginAdminGeneral);

// Routes protégées : accessibles uniquement à l’admin général connecté
router.get('/', authMiddleware(['admin_general']), adminGeneralController.getAllAdminGenerals);
router.get('/:id', authMiddleware(['admin_general']), adminGeneralController.getAdminGeneralById);
router.put('/:id', authMiddleware(['admin_general']), adminGeneralController.updateAdminGeneral);

module.exports = router;