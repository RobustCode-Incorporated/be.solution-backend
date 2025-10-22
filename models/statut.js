'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Statut extends Model {
    /**
     * Associations entre modèles
     */
    static associate(models) {
      // Un statut est utilisé dans plusieurs demandes
      Statut.hasMany(models.Demande, {
        foreignKey: 'statutId',
        as: 'demandes',
      });
    }
  }

  Statut.init(
    {
      nom: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Statut',
      tableName: 'Statuts', // optionnel si tu veux fixer le nom
      timestamps: false,    // pas nécessaire ici sauf si tu veux suivre création/modification
    }
  );

  return Statut;
};