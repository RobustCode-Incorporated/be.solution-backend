// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const { Citoyen, Administrateur, Agent, AdministrateurGeneral } = require('../models');
const { jwtSecret } = require('../config'); // clé secrète centralisée

const authMiddleware = (roles = []) => {
  return async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Token manquant' });
    }

    try {
      // Vérifie et décode le token avec la clé centralisée
      const payload = jwt.verify(token, jwtSecret);

      let user = null;

      switch (payload.role) {
        case 'citoyen':
          user = await Citoyen.findByPk(payload.id);
          break;
        case 'admin':
          user = await Administrateur.findByPk(payload.id);
          break;
        case 'agent':
          user = await Agent.findByPk(payload.id);
          break;
        case 'admin_general':
          user = await AdministrateurGeneral.findByPk(payload.id);
          break;
        default:
          return res.status(401).json({ message: 'Rôle invalide dans le token' });
      }

      if (!user) {
        return res.status(401).json({ message: 'Utilisateur invalide ou introuvable' });
      }

      // Vérifie que le rôle est autorisé à accéder à cette route
      if (roles.length && !roles.includes(payload.role)) {
        return res.status(403).json({ message: 'Accès interdit : rôle insuffisant' });
      }

      // Attache les données essentielles du token à la requête
      req.user = {
        id: payload.id,
        role: payload.role,
        provinceId: payload.provinceId || null,      // Pour admin_general
        communeId: payload.communeId || null,        // Pour agent et admin
        typeDemande: payload.typeDemande || null     // Pour agent (type de demande traité)
      };
      console.log('User attaché à la requête:', req.user); // Debug
      next();
    } catch (err) {
      console.error('Erreur vérification JWT:', err);
      return res.status(403).json({ message: 'Token invalide' });
    }
  };
};

module.exports = authMiddleware;