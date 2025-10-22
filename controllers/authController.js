// controllers/authController.js
const { Administrateur, Agent, Citoyen } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'ma_cle_super_secrete';

// Connexion pour tous les types d’utilisateurs
exports.loginUser = async (req, res) => {
  const { username, password, role } = req.body;

  try {
    let user, userRole;

    switch (role) {
      case 'admin':
        user = await Administrateur.findOne({ where: { username } });
        userRole = 'admin';
        if (!user || user.password !== password) return res.status(401).json({ message: 'Identifiants incorrects' });
        break;

      case 'agent':
        user = await Agent.findOne({ where: { username } });
        userRole = 'agent';
        if (!user || user.password !== password) return res.status(401).json({ message: 'Identifiants incorrects' });
        break;

      case 'citoyen':
        user = await Citoyen.findOne({ where: { numeroUnique: username } });
        userRole = 'citoyen';
        if (!user) return res.status(401).json({ message: 'Identifiants incorrects' });
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).json({ message: 'Identifiants incorrects' });
        break;

      default:
        return res.status(400).json({ message: 'Rôle invalide' });
    }

    const token = jwt.sign(
      { id: user.id, role: userRole, communeId: user.communeId || null },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token });

  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Inscription citoyen
exports.registerCitoyen = async (req, res) => {
  try {
    const { nom, postnom, prenom, dateNaissance, sexe, lieuNaissance, communeId, password } = req.body;

    if (!nom || !prenom || !dateNaissance || !sexe || !lieuNaissance || !communeId || !password) {
      return res.status(400).json({ message: 'Tous les champs obligatoires doivent être remplis.' });
    }

    const numeroUnique = `CIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const hashedPassword = await bcrypt.hash(password, 10);

    const citoyen = await Citoyen.create({
      nom,
      postnom,
      prenom,
      dateNaissance,
      sexe,
      lieuNaissance,
      communeId,
      numeroUnique,
      password: hashedPassword
    });

    const token = jwt.sign(
      { id: citoyen.id, role: 'citoyen', communeId: citoyen.communeId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ message: 'Inscription réussie', token, citoyen });

  } catch (error) {
    console.error('Erreur inscription citoyen:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};