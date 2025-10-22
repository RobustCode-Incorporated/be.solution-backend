const { Commune, Administrateur } = require('../models');

function buildNomComplet(communes) {
  communes.forEach(commune => {
    if (commune.administrateur) {
      const a = commune.administrateur;
      a.nomComplet = [a.nom, a.prenom, a.postnom].filter(Boolean).join(' ');
    }
  });
}

module.exports = {
  // Récupérer toutes les communes avec leur bourgmestre (administrateur)
  async getAllCommunes(req, res) {
    try {
      const communes = await Commune.findAll({
        include: [{ 
          model: Administrateur, 
          as: 'administrateur', 
          attributes: ['id', 'username', 'nom', 'prenom', 'postnom'] 
        }],
        order: [['nom', 'ASC']],
      });
      buildNomComplet(communes);
      res.status(200).json(communes);
    } catch (err) {
      console.error('Erreur getAllCommunes:', err);
      res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
  },

  // Créer une nouvelle commune
  async createCommune(req, res) {
    try {
      const { nom, code, provinceId, adminId } = req.body;
      if (!nom || !provinceId) {
        return res.status(400).json({ message: 'Nom et provinceId sont requis' });
      }
      const newCommune = await Commune.create({ nom, code, provinceId, adminId: adminId || null });
      res.status(201).json(newCommune);
    } catch (err) {
      console.error('Erreur createCommune:', err);
      res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
  },

  // Récupérer une commune par son ID
  async getCommuneById(req, res) {
    try {
      const commune = await Commune.findByPk(req.params.id, {
        include: [{ 
          model: Administrateur, 
          as: 'administrateur', 
          attributes: ['id', 'username', 'nom', 'prenom', 'postnom'] 
        }]
      });
      if (!commune) return res.status(404).json({ message: 'Commune non trouvée' });
      buildNomComplet([commune]);
      res.status(200).json(commune);
    } catch (err) {
      console.error('Erreur getCommuneById:', err);
      res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
  },

  // Mettre à jour une commune
  async updateCommune(req, res) {
    try {
      const commune = await Commune.findByPk(req.params.id);
      if (!commune) return res.status(404).json({ message: 'Commune non trouvée' });
      const { nom, code, provinceId, adminId } = req.body;
      if (nom !== undefined) commune.nom = nom;
      if (code !== undefined) commune.code = code;
      if (provinceId !== undefined) commune.provinceId = provinceId;
      if (adminId !== undefined) commune.adminId = adminId;
      await commune.save();
      res.status(200).json(commune);
    } catch (err) {
      console.error('Erreur updateCommune:', err);
      res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
  },

  // Récupérer les communes d'une province (provinceId numérique obligatoire)
  async getCommunesByProvince(req, res) {
    try {
      const provinceId = parseInt(req.params.provinceId, 10);
      if (isNaN(provinceId)) {
        return res.status(400).json({ message: 'provinceId invalide' });
      }
      const communes = await Commune.findAll({
        where: { provinceId },
        include: [{ 
          model: Administrateur, 
          as: 'administrateur', 
          attributes: ['id', 'username', 'nom', 'prenom', 'postnom'] 
        }],
        order: [['nom', 'ASC']]
      });
      buildNomComplet(communes);
      res.status(200).json(communes);
    } catch (err) {
      console.error('Erreur getCommunesByProvince:', err);
      res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
  },

  // Assigner ou supprimer un bourgmestre (adminId) à une commune
  async assignAdminToCommune(req, res) {
    try {
      const communeId = req.params.communeId;
      const { adminId } = req.body;
      const commune = await Commune.findByPk(communeId);
      if (!commune) return res.status(404).json({ message: 'Commune non trouvée' });
      commune.adminId = adminId || null;
      await commune.save();
      res.status(200).json({ message: 'Administrateur assigné', commune });
    } catch (err) {
      console.error('Erreur assignAdminToCommune:', err);
      res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
  }
};