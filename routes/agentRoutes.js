const express = require('express');
const router = express.Router();
const controller = require('../controllers/agentController');
const auth = require('../middleware/authMiddleware');

// 🔹 Connexion d’un agent (publique)
router.post('/login', controller.loginAgent);

// --- Dashboard agent ---
router.get('/dashboard', auth(['agent']), controller.getDashboardData);

// --- Demandes assignées à l'agent ---
router.get('/assigned-demandes', auth(['agent']), controller.getAssignedDemandes);

// --- Gestion des agents (réservé au bourgmestre/admin) ---
// Place ces routes après les routes spécifiques
router.post('/', auth(['admin']), controller.createAgent);
router.get('/', auth(['admin']), controller.getAgentsOfMyCommune);
router.get('/:id', auth(['admin']), controller.getAgentById);
router.put('/:id', auth(['admin']), controller.updateAgent);
router.delete('/:id', auth(['admin']), controller.deleteAgent);

module.exports = router;