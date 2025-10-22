// config.js
require('dotenv').config();

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  console.error('Erreur: La variable JWT_SECRET est manquante.');
  process.exit(1); // Arrête l'application avec une erreur
}

console.log('Clé JWT utilisée:', jwtSecret);

module.exports = {
  jwtSecret,
};