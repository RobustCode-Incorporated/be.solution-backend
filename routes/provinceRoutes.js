const express = require('express');
const router = express.Router();
const provinceController = require('../controllers/provinceController');

// Route publique (pas besoin d'authentification pour récupérer les provinces)
router.get('/', provinceController.getAllProvinces);

module.exports = router;