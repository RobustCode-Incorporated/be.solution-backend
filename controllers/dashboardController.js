const { Op } = require('sequelize');
const { AdministrateurGeneral, Commune, Agent, Demande, Statut } = require('../models');

module.exports = {
  // Statistiques pour administrateur général (gouverneur)
  async statsForAdminGeneral(req, res) {
    try {
      const adminGeneralId = req.user.id;

      const adminGeneral = await AdministrateurGeneral.findByPk(adminGeneralId);
      if (!adminGeneral) {
        return res.status(404).json({ message: 'Administrateur général introuvable.' });
      }

      const provinceId = adminGeneral.provinceId;

      // Total communes dans la province
      const totalCommunes = await Commune.count({ where: { provinceId } });

      // Communes avec bourgmestre (adminId non null)
      const communesAvecBourgmestre = await Commune.count({
        where: {
          provinceId,
          adminId: { [Op.ne]: null }
        }
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
        error: error.message
      });
    }
  },

  // Statistiques pour bourgmestre (dashboard bourgmestre)
  async getStatsBourgmestre(req, res) {
    try {
      const adminId = req.user.id;

      // Trouver la commune supervisée par ce bourgmestre (adminId)
      const commune = await Commune.findOne({ where: { adminId } });
      if (!commune) {
        return res.status(404).json({ message: "Commune introuvable pour ce bourgmestre" });
      }

      const communeId = commune.id;

      // Helper pour compter demandes par nom statut
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

      res.status(200).json({
        totalDemandes,
        demandesSoumises,
        demandesEnTraitement,
        demandesValidees,
        totalAgents,
      });
    } catch (error) {
      console.error('Erreur getStatsBourgmestre:', error);
      res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
  }
};