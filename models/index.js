'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';

// Chargement de la config selon l'environnement (si besoin)
const config = require(path.join(__dirname, '/../config/config.js'))[env];
const db = {};

let sequelize;

// ✅ 1️⃣ Priorité à DATABASE_URL (Render / Neon)
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
  console.log('🌐 Connexion via DATABASE_URL (Render / Neon)');
}

// ✅ 2️⃣ Sinon, fallback sur MY_DATABASE_URL (optionnel)
else if (process.env.MY_DATABASE_URL) {
  sequelize = new Sequelize(process.env.MY_DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
  console.log('🌐 Connexion via MY_DATABASE_URL');
}

// ✅ 3️⃣ Sinon, config locale (dev)
else {
  sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: config.dialect,
    logging: config.logging || false,
  });
  console.log('💻 Connexion locale (config.js)');
}

// Lecture automatique des fichiers modèles
fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1 &&
      file !== 'administrateurGeneral.js'
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Import manuel du modèle AdministrateurGeneral
const AdministrateurGeneral = require('./administrateurGeneral')(sequelize, Sequelize.DataTypes);
db.AdministrateurGeneral = AdministrateurGeneral;

// Associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Test de connexion
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion PostgreSQL réussie');
  } catch (error) {
    console.error('❌ Erreur de connexion à PostgreSQL :', error.message);
  }
})();

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;