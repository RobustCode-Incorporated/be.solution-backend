const express = require('express');
const router = express.Router();
const demandeController = require('../controllers/demandeController');
const auth = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Route pour le citoyen connecté - doit être avant les routes génériques
router.get('/me', auth(['citoyen']), demandeController.getMyDemandes);

// Route d'upload d'image (utilisation correcte de multer et du handler)
router.post('/upload', auth(['citoyen', 'agent', 'admin', 'admin_general']), upload.single('photo'), demandeController.uploadImage);

// Routes pour les demandes à valider par les agents et admins
router.get('/validation', auth(['agent', 'admin', 'admin_general']), demandeController.getDemandesToValidate);

// Téléchargement d'un document
// Assurez-vous que downloadDocument est bien défini dans demandeController
// Si non utilisé, cette route peut être commentée ou supprimée
// router.get('/:id/download', auth(['citoyen', 'agent', 'admin', 'admin_general']), demandeController.downloadDocument);

// Génération d'un document
router.put('/:id/generate-document', auth(['agent', 'admin', 'admin_general']), demandeController.generateDocument);

// Validation/signature du document
router.put('/:id/validate-document', auth(['admin', 'admin_general']), demandeController.validateDocument);

// Routes génériques (toujours à la fin)
router.get('/', auth(['agent', 'admin', 'admin_general']), demandeController.getAllDemandes);
router.get('/:id', auth(['agent', 'admin', 'admin_general']), demandeController.getDemandeById);
router.post('/', auth(['citoyen']), demandeController.createDemande);
router.put('/:id', auth(['agent', 'admin', 'admin_general']), demandeController.updateDemande);
router.delete('/:id', auth(['admin', 'admin_general']), demandeController.deleteDemande);

module.exports = router;