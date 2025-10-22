// routes/statutRoutes.js
const express = require('express');
const router = express.Router();
const statutController = require('../controllers/statutController');
const demandeController = require('../controllers/demandeController');
const auth = require('../middleware/authMiddleware');

// Route unifiée pour la récupération des statuts par plusieurs rôles
// Les agents, les administrateurs et les citoyens peuvent y accéder.
// L'important est que l'authentification soit correcte pour tous ces rôles.
router.get('/', auth(['citoyen', 'admin_general', 'admin', 'agent']), statutController.getAllStatuts);

// Les autres routes restent inchangées
router.post('/', auth(['admin']), statutController.createStatut);
router.get('/dashboardAdmin', auth(['admin_general']), statutController.getDashboardStats);

// La route publique peut être conservée si nécessaire pour un accès sans authentification
router.get('/public', statutController.getAllStatutsPublic);

module.exports = router;