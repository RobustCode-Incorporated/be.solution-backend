const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/authMiddleware');

// Accès réservé aux administrateurs généraux (gouverneur)
router.get('/admin-general', auth(['admin_general']), dashboardController.statsForAdminGeneral);
router.get('/population', auth(['admin_general']), dashboardController.populationStats);

// Accès réservé aux bourgmestres (admins avec rôle 'admin')
router.get('/bourgmestre', auth(['admin']), dashboardController.getStatsBourgmestre);

module.exports = router;