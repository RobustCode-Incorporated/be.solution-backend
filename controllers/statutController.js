// controllers/statutController.js
const { Statut, Commune, Administrateur, Agent } = require('../models');

const getAllStatuts = async (req, res) => {
  try {
    const statuts = await Statut.findAll();
    res.json(statuts);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

const createStatut = async (req, res) => {
  try {
    const newStatut = await Statut.create(req.body);
    res.status(201).json(newStatut);
  } catch (error) {
    res.status(400).json({ message: 'Erreur création', error });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const communesCount = await Commune.count();
    const administrateursCount = await Administrateur.count();
    const agentsCount = await Agent.count();
    res.status(200).json({ communes: communesCount, administrateurs: administrateursCount, agents: agentsCount });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du chargement des statistiques', error });
  }
};

// Route publique pour que les citoyens puissent voir les statuts
const getAllStatutsPublic = async (req, res) => {
  try {
    const statuts = await Statut.findAll();
    res.json(statuts);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

module.exports = {
  getAllStatuts,
  createStatut,
  getDashboardStats,
  getAllStatutsPublic
};