// controllers/administrateurController.js
const { Administrateur, Commune } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config'); // clé secrète centralisée

module.exports = {
  // Création d’un bourgmestre par un gouverneur
  async createAdministrateur(req, res) {
    try {
      const { username, password, communeId, nom, prenom, postnom, email } = req.body;

      if (!nom || !username || !password || !communeId) {
        return res.status(400).json({ message: "Champs obligatoires manquants." });
      }

      const commune = await Commune.findByPk(communeId);
      if (!commune) {
        return res.status(404).json({ message: "Commune introuvable." });
      }

      if (commune.adminId) {
        return res.status(400).json({ message: "Cette commune a déjà un bourgmestre." });
      }

      const existingUser = await Administrateur.findOne({ where: { username } });
      if (existingUser) {
        return res.status(400).json({ message: "Nom d'utilisateur déjà utilisé." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const admin = await Administrateur.create({
        nom,
        prenom,
        postnom,
        username,
        email,
        password: hashedPassword,
        role: 'admin' // Bourgmestre
      });

      commune.adminId = admin.id;
      await commune.save();

      res.status(201).json({ message: "Bourgmestre ajouté avec succès", admin });
    } catch (err) {
      console.error("Erreur création administrateur :", err);
      res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
  },

  // Login administrateur (gouverneur ou bourgmestre)
  async loginAdministrateur(req, res) {
    try {
      const { username, password } = req.body;

      const admin = await Administrateur.findOne({ where: { username } });
      if (!admin) return res.status(404).json({ message: "Administrateur non trouvé" });

      const match = await bcrypt.compare(password, admin.password);
      if (!match) return res.status(401).json({ message: "Mot de passe incorrect" });

      let provinceId = null;
      let communeId = null;

      if (admin.role === 'admin_general') {
        provinceId = admin.provinceId || null;
      } else if (admin.role === 'admin') {
        const commune = await Commune.findOne({
          where: { adminId: admin.id },
          attributes: ['id', 'provinceId']
        });
        if (commune) {
          provinceId = commune.provinceId;
          communeId = commune.id;
        }
      }

      const token = jwt.sign(
        {
          id: admin.id,
          role: admin.role,
          provinceId,
          communeId
        },
        jwtSecret,
        { expiresIn: '1d' }
      );

      res.status(200).json({ token });
    } catch (err) {
      console.error("Erreur loginAdministrateur:", err);
      res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
  },

  // Liste de tous les bourgmestres
  async getAllAdministrateurs(req, res) {
    try {
      const admins = await Administrateur.findAll({
        attributes: ['id', 'username', 'nom', 'prenom', 'postnom', 'role', 'email'],
        include: {
          model: Commune,
          as: 'communes',
          attributes: ['id', 'nom', 'code', 'provinceId']
        }
      });

      const adminsWithFullName = admins.map(admin => ({
        ...admin.get({ plain: true }),
        nomComplet: [admin.nom, admin.prenom, admin.postnom].filter(Boolean).join(' ')
      }));

      res.status(200).json(adminsWithFullName);
    } catch (err) {
      console.error("Erreur getAllAdministrateurs:", err);
      res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
  },

  // Récupérer les bourgmestres de la province d’un gouverneur
  async getAdminsOfMyProvince(req, res) {
    try {
      if (req.user.role !== 'admin_general') {
        return res.status(403).json({ message: "Accès interdit : rôle insuffisant" });
      }

      const { provinceId } = req.user;
      if (!provinceId) {
        return res.status(400).json({ message: "Province ID manquant dans le token" });
      }

      const communes = await Commune.findAll({
        where: { provinceId },
        attributes: ['adminId'],
        raw: true
      });

      const adminIds = communes.map(c => c.adminId).filter(id => id !== null);

      const admins = await Administrateur.findAll({
        where: { id: adminIds },
        attributes: ['id', 'username', 'nom', 'prenom', 'postnom', 'role']
      });

      const adminsWithFullName = admins.map(admin => ({
        ...admin.get({ plain: true }),
        nomComplet: [admin.nom, admin.prenom, admin.postnom].filter(Boolean).join(' ')
      }));

      res.status(200).json(adminsWithFullName);
    } catch (err) {
      console.error("Erreur getAdminsOfMyProvince:", err);
      res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
  },

  // Récupérer un bourgmestre par ID
  async getAdministrateurById(req, res) {
    try {
      const admin = await Administrateur.findByPk(req.params.id);
      if (!admin) return res.status(404).json({ message: "Non trouvé" });

      res.status(200).json(admin);
    } catch (err) {
      console.error("Erreur getAdministrateurById:", err);
      res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
  },

  // Mettre à jour un bourgmestre
  async updateAdministrateur(req, res) {
    try {
      const admin = await Administrateur.findByPk(req.params.id);
      if (!admin) return res.status(404).json({ message: "Non trouvé" });

      const { username, password, nom, prenom, postnom, email } = req.body;

      if (username) admin.username = username;
      if (password) admin.password = await bcrypt.hash(password, 10);
      if (nom) admin.nom = nom;
      if (prenom) admin.prenom = prenom;
      if (postnom) admin.postnom = postnom;
      if (email) admin.email = email;

      await admin.save();

      res.status(200).json(admin);
    } catch (err) {
      console.error("Erreur updateAdministrateur:", err);
      res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
  },

  // Supprimer un bourgmestre et désassigner la commune liée
  async deleteAdministrateur(req, res) {
    try {
      const adminId = req.params.id;

      const admin = await Administrateur.findByPk(adminId);
      if (!admin) {
        return res.status(404).json({ message: "Bourgmestre non trouvé" });
      }

      const commune = await Commune.findOne({ where: { adminId } });
      if (commune) {
        commune.adminId = null;
        await commune.save();
      }

      await admin.destroy();

      res.status(200).json({ message: "Bourgmestre supprimé avec succès" });
    } catch (err) {
      console.error("Erreur suppression administrateur :", err);
      res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
  }
};