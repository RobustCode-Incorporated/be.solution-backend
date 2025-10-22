const { Province } = require('../models');

exports.getAllProvinces = async (req, res) => {
  try {
    const provinces = await Province.findAll({ order: [['nom', 'ASC']] });
    res.status(200).json(provinces);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur lors du chargement des provinces', error });
  }
};