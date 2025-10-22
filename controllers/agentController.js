// controllers/agentController.js
const { Agent, Commune, Demande, Citoyen, Statut } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'ma_cle_super_secrete';

module.exports = {
  // --- Création agent (par bourgmestre uniquement) ---
  async createAgent(req, res) {
    try {
      const { nom, prenom, postnom, username, password, typeDemande } = req.body;

      const adminId = req.user?.id;
      if (!adminId || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Accès refusé" });
      }

      // Trouver la commune associée au bourgmestre
      const commune = await Commune.findOne({ where: { adminId } });
      if (!commune) {
        return res.status(400).json({ message: "Impossible de trouver votre commune" });
      }

      // Vérifier unicité du username
      const existing = await Agent.findOne({ where: { username } });
      if (existing) {
        return res.status(400).json({ message: "Nom d'utilisateur déjà utilisé" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // Créer l'agent lié à la commune
      const agent = await Agent.create({
        nom,
        prenom,
        postnom,
        username,
        password: hashedPassword,
        communeId: commune.id,
        typeDemande
      });

      res.status(201).json(agent);
    } catch (err) {
      console.error('Erreur createAgent:', err);
      res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
  },

  // --- Connexion agent ---
  async loginAgent(req, res) {
    try {
      const { username, password } = req.body;

      const agent = await Agent.findOne({ where: { username } });
      if (!agent) return res.status(404).json({ message: "Agent non trouvé" });

      const match = await bcrypt.compare(password, agent.password);
      if (!match) return res.status(401).json({ message: "Mot de passe incorrect" });

      // Générer token avec id, rôle, communeId et typeDemande
      const token = jwt.sign(
        {
          id: agent.id,
          role: 'agent',
          communeId: agent.communeId,
          typeDemande: agent.typeDemande
        },
        JWT_SECRET,
        { expiresIn: '1d' }
      );

      res.status(200).json({ token });
    } catch (err) {
      console.error('Erreur loginAgent:', err);
      res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
  },

  // --- Données dashboard agent ---
  async getDashboardData(req, res) {
    try {
      if (req.user.role !== 'agent') {
        return res.status(403).json({ message: "Accès refusé" });
      }

      if (!req.user.communeId || !req.user.typeDemande) {
        return res.status(400).json({ message: "Données utilisateur incomplètes (communeId/typeDemande)" });
      }

      const totalDemandes = await Demande.count({
        where: {
          communeId: req.user.communeId,
          typeDemande: req.user.typeDemande
        }
      });

      const demandesEnTraitement = await Demande.count({
        where: {
          communeId: req.user.communeId,
          typeDemande: req.user.typeDemande,
          statutId: 2 // Par exemple statutId 2 = "en traitement"
        }
      });

      res.json({
        totalDemandes,
        demandesEnTraitement
      });
    } catch (err) {
      console.error('Erreur getDashboardData:', err);
      res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
  },

  // --- Lister demandes assignées à l'agent ---
  async getAssignedDemandes(req, res) {
    try {
      if (req.user.role !== 'agent') {
        return res.status(403).json({ message: "Accès refusé" });
      }

      if (!req.user.communeId || !req.user.typeDemande) {
        return res.status(400).json({ message: "Données utilisateur incomplètes (communeId ou typeDemande manquant)" });
      }

      const demandes = await Demande.findAll({
        where: {
          communeId: req.user.communeId,
          typeDemande: req.user.typeDemande
        },
        include: [
          { model: Citoyen, as: 'citoyen' },
          { model: Statut, as: 'statut' }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.json(demandes);
    } catch (err) {
      console.error('Erreur getAssignedDemandes:', err);
      res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
  },

  // --- Voir agents de ma commune (réservé au bourgmestre) ---
  async getAgentsOfMyCommune(req, res) {
    try {
      const adminId = req.user?.id;
      if (!adminId || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Accès refusé" });
      }

      const commune = await Commune.findOne({ where: { adminId } });
      if (!commune) {
        return res.status(400).json({ message: "Impossible de trouver votre commune" });
      }

      const agents = await Agent.findAll({
        where: { communeId: commune.id },
        include: [{ model: Commune, as: 'commune' }]
      });

      res.status(200).json(agents);
    } catch (err) {
      console.error('Erreur getAgentsOfMyCommune:', err);
      res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
  },

  // --- Voir un agent ---
  async getAgentById(req, res) {
    try {
      const agent = await Agent.findByPk(req.params.id, {
        include: [{ model: Commune, as: 'commune' }]
      });
      if (!agent) return res.status(404).json({ message: "Agent non trouvé" });

      res.status(200).json(agent);
    } catch (err) {
      console.error('Erreur getAgentById:', err);
      res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
  },

  // --- Mettre à jour un agent ---
  async updateAgent(req, res) {
    try {
      const { nom, prenom, postnom, username, password, typeDemande } = req.body;

      const agent = await Agent.findByPk(req.params.id);
      if (!agent) return res.status(404).json({ message: "Agent non trouvé" });

      if (nom) agent.nom = nom;
      if (prenom) agent.prenom = prenom;
      if (postnom) agent.postnom = postnom;
      if (username) agent.username = username;
      if (password) agent.password = await bcrypt.hash(password, 10);
      if (typeDemande) agent.typeDemande = typeDemande;

      await agent.save();

      res.status(200).json(agent);
    } catch (err) {
      console.error('Erreur updateAgent:', err);
      res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
  },

  // --- Supprimer un agent ---
  async deleteAgent(req, res) {
    try {
      const agent = await Agent.findByPk(req.params.id);
      if (!agent) return res.status(404).json({ message: "Agent non trouvé" });

      await agent.destroy();
      res.status(200).json({ message: "Agent supprimé avec succès" });
    } catch (err) {
      console.error('Erreur deleteAgent:', err);
      res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
  }
};