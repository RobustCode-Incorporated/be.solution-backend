// models/agent.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Agent extends Model {
    static associate(models) {
      // Un agent appartient à une commune
      Agent.belongsTo(models.Commune, {
        foreignKey: 'communeId',
        as: 'commune'
      });
    }
  }

  Agent.init(
    {
      nom: {
        type: DataTypes.STRING,
        allowNull: false
      },
      prenom: {
        type: DataTypes.STRING,
        allowNull: false
      },
      postnom: {
        type: DataTypes.STRING,
        allowNull: true
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false
      },
      communeId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      typeDemande: {
        type: DataTypes.ENUM('carte_identite', 'acte_naissance', 'acte_mariage', 'acte_residence'),
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'Agent',
      tableName: 'Agents',
      timestamps: true
    }
  );

  return Agent;
};