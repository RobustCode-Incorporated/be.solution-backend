// routes/administrateurRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/administrateurController');
const authMiddleware = require('../middleware/authMiddleware');

// Login bourgmestre ou gouverneur
router.post('/login', adminController.loginAdministrateur);

// Création bourgmestre → réservé aux gouverneurs
router.post('/', authMiddleware(['admin_general']), adminController.createAdministrateur);

// Liste tous les bourgmestres → réservé aux gouverneurs
router.get('/', authMiddleware(['admin_general']), adminController.getAllAdministrateurs);

// Récupérer bourgmestres de la province du gouverneur connecté
router.get('/province', authMiddleware(['admin_general']), adminController.getAdminsOfMyProvince);

// Récupérer un admin par ID
router.get('/:id', authMiddleware(['admin_general']), adminController.getAdministrateurById);

// Modifier un bourgmestre → réservé aux gouverneurs
router.put('/:id', authMiddleware(['admin_general']), adminController.updateAdministrateur);

// Supprimer un bourgmestre → réservé aux gouverneurs
router.delete('/:id', authMiddleware(['admin_general']), adminController.deleteAdministrateur);

module.exports = router;