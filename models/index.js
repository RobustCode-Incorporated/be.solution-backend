'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';

// Chargement de la config selon l'environnement
const config = require(path.join(__dirname, '/../config/config.js'))[env];

const db = {};

let sequelize;
if (config.use_env_variable) {
  // Utilisation de la variable d'environnement si configurée
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  // Sinon on utilise la config du fichier JSON
  sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: config.dialect, // IMPORTANT: on s'assure de prendre le dialect depuis config.json
    logging: false,          // optionnel : désactive logs SQL (à adapter)
  });
}

// Lecture automatique des fichiers modèles dans ce dossier, sauf administrateurGeneral.js
fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1 &&
      file !== 'administrateurGeneral.js' // import manuel en dessous
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Import manuel du modèle AdministrateurGeneral (pour éviter double import ou conflit)
const AdministrateurGeneral = require('./administrateurGeneral')(sequelize, Sequelize.DataTypes);
db.AdministrateurGeneral = AdministrateurGeneral;

// Définition des associations (relations entre modèles)
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Export de l'instance Sequelize et des modèles
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;