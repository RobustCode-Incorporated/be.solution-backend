const express = require('express');
const router = express.Router();
const controller = require('../controllers/communeController');
const auth = require('../middleware/authMiddleware');

// Route publique - Toutes les communes
router.get('/', controller.getAllCommunes);

// Communes d'une province (protégée, admin_general seulement)
router.get('/province/:provinceId', auth(['admin_general']), controller.getCommunesByProvince);

// Création, lecture, mise à jour commune (admin seulement)
router.post('/', auth(['admin']), controller.createCommune);
router.get('/:id', auth(['admin']), controller.getCommuneById);
router.put('/:id', auth(['admin']), controller.updateCommune);

// Assignation admin (admin_general seulement)
router.put('/:communeId/assign-admin', auth(['admin_general']), controller.assignAdminToCommune);

module.exports = router;