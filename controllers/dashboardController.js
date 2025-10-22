const { Op } = require('sequelize');
const { AdministrateurGeneral, Commune, Agent, Demande, Statut, Citoyen } = require('../models');

module.exports = {
  // ------------------------
  // Statistiques pour Admin Général
  // ------------------------
  async statsForAdminGeneral(req, res) {
    try {
      const adminGeneralId = req.user.id;

      const adminGeneral = await AdministrateurGeneral.findByPk(adminGeneralId);
      if (!adminGeneral) {
        return res.status(404).json({ message: 'Administrateur général introuvable.' });
      }

      const provinceId = adminGeneral.provinceId;

      // Total communes
      const totalCommunes = await Commune.count({ where: { provinceId } });

      // Communes avec bourgmestre
      const communesAvecBourgmestre = await Commune.count({
        where: { provinceId, adminId: { [Op.ne]: null } }
      });

      const communesSansBourgmestre = totalCommunes - communesAvecBourgmestre;

      // Total agents dans la province via jointure commune
      const totalAgents = await Agent.count({
        include: [{
          model: Commune,
          as: 'commune',
          where: { provinceId }
        }]
      });

      res.status(200).json({
        totalCommunes,
        communesAvecBourgmestre,
        communesSansBourgmestre,
        totalAgents
      });

    } catch (error) {
      console.error('Erreur dashboard admin général:', error);
      res.status(500).json({
        message: "Erreur lors du chargement des statistiques",
        totalCommunes: 0,
        communesAvecBourgmestre: 0,
        communesSansBourgmestre: 0,
        totalAgents: 0,
        error: error.message
      });
    }
  },

  // ------------------------
  // Statistiques pour Bourgmestre
  // ------------------------
  async getStatsBourgmestre(req, res) {
    try {
      const adminId = req.user.id;

      // Récupère la commune du bourgmestre
      const commune = await Commune.findOne({ where: { adminId } });
      if (!commune) {
        return res.status(404).json({ message: "Commune introuvable pour ce bourgmestre" });
      }

      const communeId = commune.id;

      // Comptage des demandes selon statut
      const countDemandesByStatut = async (statutNom) => {
        return await Demande.count({
          where: { communeId },
          include: [{
            model: Statut,
            as: 'statut',
            where: { nom: statutNom }
          }]
        });
      };

      const totalDemandes = await Demande.count({ where: { communeId } });
      const demandesSoumises = await countDemandesByStatut('soumise');
      const demandesEnTraitement = await countDemandesByStatut('en traitement');
      const demandesValidees = await countDemandesByStatut('validée');

      // Total agents dans la commune
      const totalAgents = await Agent.count({ where: { communeId } });

      // Population de la commune
      const citoyens = await Citoyen.findAll({ where: { communeId } });
      const totalCitoyens = citoyens.length;
      const hommes = citoyens.filter(c => c.sexe?.toLowerCase() === 'homme').length;
      const femmes = citoyens.filter(c => c.sexe?.toLowerCase() === 'femme').length;

      let jeune = 0, adulte = 0, senior = 0;
      const currentYear = new Date().getFullYear();
      citoyens.forEach(c => {
        if (!c.dateNaissance) return;
        const age = currentYear - new Date(c.dateNaissance).getFullYear();
        if (age <= 17) jeune++;
        else if (age <= 59) adulte++;
        else senior++;
      });

      res.status(200).json({
        totalDemandes,
        demandesSoumises,
        demandesEnTraitement,
        demandesValidees,
        totalAgents,
        totalCitoyens,
        hommes,
        femmes,
        jeune,
        adulte,
        senior
      });

    } catch (error) {
      console.error('Erreur getStatsBourgmestre:', error);
      res.status(500).json({
        message: "Erreur serveur",
        totalDemandes: 0,
        demandesSoumises: 0,
        demandesEnTraitement: 0,
        demandesValidees: 0,
        totalAgents: 0,
        totalCitoyens: 0,
        hommes: 0,
        femmes: 0,
        jeune: 0,
        adulte: 0,
        senior: 0,
        error: error.message
      });
    }
  },

  // ------------------------
  // Statistiques pour Agent
  // ------------------------
  async getStatsAgent(req, res) {
    try {
      const agentId = req.user.id;
  
      const agent = await Agent.findByPk(agentId);
      if (!agent) {
        return res.status(404).json({ message: "Agent introuvable" });
      }
  
      const communeId = agent.communeId;
  
      const totalDemandes = await Demande.count({ where: { communeId } });
      const demandesSoumises = await Demande.count({ where: { communeId, statutId: 1 } });
      const demandesEnTraitement = await Demande.count({ where: { communeId, statutId: 2 } });
      const demandesValidees = await Demande.count({ where: { communeId, statutId: 3 } });
  
      res.status(200).json({
        totalDemandes,
        demandesSoumises,
        demandesEnTraitement,
        demandesValidees
      });
  
    } catch (error) {
      console.error('Erreur getStatsAgent:', error);
      res.status(500).json({
        message: "Erreur serveur",
        totalDemandes: 0,
        demandesSoumises: 0,
        demandesEnTraitement: 0,
        demandesValidees: 0,
        error: error.message
      });
    }
  },

  // ------------------------
  // Statistiques population pour Admin Général
  // ------------------------
  async populationStats(req, res) {
    try {
      const adminGeneralId = req.user.id;
      const adminGeneral = await AdministrateurGeneral.findByPk(adminGeneralId);
      if (!adminGeneral) {
        return res.status(404).json({ message: 'Administrateur général introuvable.' });
      }
      const provinceId = adminGeneral.provinceId;

      // Récupère tous les citoyens de la province
      const citoyens = await Citoyen.findAll({
        include: [{
          model: Commune,
          as: 'commune',
          required: false,
          where: { provinceId }
        }]
      });

      const totalPopulation = citoyens.length;
      const hommes = citoyens.filter(c => c.sexe?.toLowerCase() === 'homme').length;
      const femmes = citoyens.filter(c => c.sexe?.toLowerCase() === 'femme').length;

      let jeune = 0, adulte = 0, senior = 0;
      const currentYear = new Date().getFullYear();
      citoyens.forEach(c => {
        if (!c.dateNaissance) return;
        const age = currentYear - new Date(c.dateNaissance).getFullYear();
        if (age <= 17) jeune++;
        else if (age <= 59) adulte++;
        else senior++;
      });

      res.status(200).json({
        totalPopulation,
        hommes,
        femmes,
        jeune,
        adulte,
        senior
      });

    } catch (error) {
      console.error('Erreur populationStats:', error);
      res.status(500).json({
        message: 'Erreur lors du calcul de la population',
        totalPopulation: 0,
        hommes: 0,
        femmes: 0,
        jeune: 0,
        adulte: 0,
        senior: 0,
        error: error.message
      });
    }
  }
};