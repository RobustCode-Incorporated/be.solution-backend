// routes/statutRoutes.js
const express = require('express');
const router = express.Router();
const statutController = require('../controllers/statutController');
const demandeController = require('../controllers/demandeController');
const auth = require('../middleware/authMiddleware');

router.get('/', auth(['citoyen', 'admin_general', 'admin', 'agent']), statutController.getAllStatuts);

router.post('/', auth(['admin']), statutController.createStatut);

router.get('/dashboardAdmin', auth(['admin_general']), statutController.getDashboardStats);

router.get('/public', statutController.getAllStatutsPublic);

module.exports = router;