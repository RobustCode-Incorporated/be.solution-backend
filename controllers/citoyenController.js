const { Citoyen, Commune } = require('../models');

exports.getAllCitoyens = async (req, res) => {
  try {
    const citoyens = await Citoyen.findAll();
    res.json(citoyens);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

exports.getCitoyenById = async (req, res) => {
  try {
    const citoyen = await Citoyen.findByPk(req.params.id);
    if (!citoyen) return res.status(404).json({ message: 'Citoyen non trouvé' });
    res.json(citoyen);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

exports.createCitoyen = async (req, res) => {
  try {
    const newCitoyen = await Citoyen.create(req.body);
    res.status(201).json(newCitoyen);
  } catch (error) {
    res.status(400).json({ message: 'Erreur création citoyen', error });
  }
};

exports.updateCitoyen = async (req, res) => {
  try {
    const citoyen = await Citoyen.findByPk(req.params.id);
    if (!citoyen) return res.status(404).json({ message: 'Citoyen non trouvé' });

    await citoyen.update(req.body);
    res.json(citoyen);
  } catch (error) {
    res.status(400).json({ message: 'Erreur mise à jour', error });
  }
};

exports.deleteCitoyen = async (req, res) => {
  try {
    const citoyen = await Citoyen.findByPk(req.params.id);
    if (!citoyen) return res.status(404).json({ message: 'Citoyen non trouvé' });

    await citoyen.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: 'Erreur suppression', error });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const citoyen = await Citoyen.findByPk(req.user.id, {
      include: [
        { model: Commune, as: 'commune' }
      ]
    });

    if (!citoyen) return res.status(404).json({ message: 'Citoyen non trouvé' });

    res.json(citoyen);
  } catch (error) {
    console.error('Erreur getProfile:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};