// controllers/citoyenController.js
const { Citoyen, Commune } = require('../models');
const bcrypt = require('bcryptjs');

// --- Lister tous les citoyens ---
exports.getAllCitoyens = async (req, res) => {
  try {
    const citoyens = await Citoyen.findAll({
      include: [{ model: Commune, as: 'commune' }]
    });
    res.json(citoyens);
  } catch (error) {
    console.error('Erreur getAllCitoyens:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// --- Voir un citoyen par ID ---
exports.getCitoyenById = async (req, res) => {
  try {
    const citoyen = await Citoyen.findByPk(req.params.id, {
      include: [{ model: Commune, as: 'commune' }]
    });
    if (!citoyen) return res.status(404).json({ message: 'Citoyen non trouvé' });
    res.json(citoyen);
  } catch (error) {
    console.error('Erreur getCitoyenById:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// --- Créer un citoyen ---
exports.createCitoyen = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: 'Le mot de passe est obligatoire.' });

    // Hashage du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    req.body.password = hashedPassword;

    const citoyen = await Citoyen.create(req.body);
    res.status(201).json(citoyen);
  } catch (error) {
    console.error('Erreur createCitoyen:', error);
    res.status(400).json({ message: 'Erreur création citoyen', error: error.message });
  }
};

// --- Mettre à jour un citoyen ---
exports.updateCitoyen = async (req, res) => {
  try {
    const citoyen = await Citoyen.findByPk(req.params.id);
    if (!citoyen) return res.status(404).json({ message: 'Citoyen non trouvé' });

    // Hashage si mot de passe mis à jour
    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }

    await citoyen.update(req.body);
    res.json(citoyen);
  } catch (error) {
    console.error('Erreur updateCitoyen:', error);
    res.status(400).json({ message: 'Erreur mise à jour', error: error.message });
  }
};

// --- Supprimer un citoyen ---
exports.deleteCitoyen = async (req, res) => {
  try {
    const citoyen = await Citoyen.findByPk(req.params.id);
    if (!citoyen) return res.status(404).json({ message: 'Citoyen non trouvé' });

    await citoyen.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Erreur deleteCitoyen:', error);
    res.status(400).json({ message: 'Erreur suppression', error: error.message });
  }
};

// --- Récupérer le profil du citoyen connecté ---
exports.getProfile = async (req, res) => {
  try {
    const citoyen = await Citoyen.findByPk(req.user.id, {
      include: [{ model: Commune, as: 'commune' }]
    });
    if (!citoyen) return res.status(404).json({ message: 'Citoyen non trouvé' });

    res.json(citoyen);
  } catch (error) {
    console.error('Erreur getProfile:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};