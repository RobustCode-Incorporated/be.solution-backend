'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Demande extends Model {
    /**
     * Définition des associations entre modèles
     */
    static associate(models) {
      // Une demande appartient à un citoyen
      Demande.belongsTo(models.Citoyen, {
        foreignKey: 'citoyenId',
        as: 'citoyen',
      });

      // Une demande appartient à une commune
      Demande.belongsTo(models.Commune, {
        foreignKey: 'communeId',
        as: 'commune',
      });

      // Une demande peut être assignée à un agent
      Demande.belongsTo(models.Agent, {
        foreignKey: 'agentId',
        as: 'agent',
      });

      // Une demande a un statut (ex : En cours, Validée...)
      Demande.belongsTo(models.Statut, {
        foreignKey: 'statutId',
        as: 'statut',
      });
    }
  }

  Demande.init(
    {
      citoyenId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      communeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      typeDemande: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      statutId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      donneesJson: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      commentaires: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // NOUVEAUX CHAMPS AJOUTÉS POUR LE PROCESSUS DE VALIDATION
      documentPath: {
        type: DataTypes.STRING,
        allowNull: true, // Le chemin est nul jusqu'à la génération du doc
      },
      verificationToken: {
        type: DataTypes.UUID, // Un token unique pour la validation
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Demande',
      tableName: 'Demandes',
      timestamps: true,
    }
  );

  return Demande;
};