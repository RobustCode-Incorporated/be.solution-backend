// routes/demandeRoutes.js
const express = require('express');
const router = express.Router();
const demandeController = require('../controllers/demandeController');
const auth = require('../middleware/authMiddleware');

// Route pour le citoyen connecté DOIT être définie avant les routes génériques
router.get('/me', auth(['citoyen']), demandeController.getMyDemandes);

// Route d'upload d'image
router.post('/upload', demandeController.uploadImage); // C'est ici que la fonction est appelée

// Route pour récupérer les documents validés
router.get('/validated', auth(['citoyen']), demandeController.getValidatedDocuments);

// Route pour les demandes à valider par les agents et admins
router.get('/validation', auth(['agent', 'admin', 'admin_general']), demandeController.getDemandesToValidate);

// Nouvelle route pour le téléchargement du document
router.get('/:id/download', auth(['citoyen', 'agent', 'admin', 'admin_general']), demandeController.downloadDocument);

// Nouvelle route pour générer le fichier Wallet Apple/Google
router.get('/:id/wallet', auth(['citoyen', 'agent', 'admin', 'admin_general']), demandeController.generateWalletPass);

// Les routes avec des paramètres généraux comme ':id' DOIVENT être définies après
router.get('/', auth(['agent', 'admin', 'admin_general']), demandeController.getAllDemandes);
router.get('/:id', auth(['agent', 'admin', 'admin_general']), demandeController.getDemandeById);

router.post('/', auth(['citoyen' ]), demandeController.createDemande);
router.put('/:id', auth(['agent', 'admin', 'admin_general']), demandeController.updateDemande);
router.delete('/:id', auth(['admin', 'admin_general']), demandeController.deleteDemande);

// Routes de génération et de validation/signature des documents
router.put('/:id/generate-document', auth(['agent', 'admin', 'admin_general']), demandeController.generateDocument);
router.put('/:id/validate-document', auth(['admin', 'admin_general']), demandeController.validateDocument);

module.exports = router;