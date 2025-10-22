'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Citoyen extends Model {
    /**
     * Associations entre modèles
     */
    static associate(models) {
      // Un citoyen appartient à une commune
      Citoyen.belongsTo(models.Commune, {
        foreignKey: 'communeId',
        as: 'commune',
      });

      // Un citoyen peut avoir plusieurs demandes
      Citoyen.hasMany(models.Demande, {
        foreignKey: 'citoyenId',
        as: 'demandes',
      });
    }
  }

  Citoyen.init(
    {
      nom: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      postnom: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      prenom: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      dateNaissance: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      sexe: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lieuNaissance: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      communeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      numeroUnique: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Citoyen',
      tableName: 'Citoyens', // Optionnel
      timestamps: true,
    }
  );

  return Citoyen;
};