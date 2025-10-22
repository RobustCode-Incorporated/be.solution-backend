require('dotenv').config(); // charge les variables d'environnement

module.exports = {
  development: {
    username: process.env.DB_USER || "johnluc",
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME || "ma_commune_be",
    host: process.env.DB_HOST || "127.0.0.1",
    port: process.env.DB_PORT || 5432,
    dialect: process.env.DB_DIALECT || "postgres"
  },
  test: {
    username: process.env.DB_USER || "johnluc",
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME || "database_test",
    host: process.env.DB_HOST || "127.0.0.1",
    port: process.env.DB_PORT || 5432,
    dialect: process.env.DB_DIALECT || "postgres"
  },
  production: {
    username: process.env.DB_USER || "johnluc",
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME || "database_production",
    host: process.env.DB_HOST || "127.0.0.1",
    port: process.env.DB_PORT || 5432,
    dialect: process.env.DB_DIALECT || "postgres"
  }
};