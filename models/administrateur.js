'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Administrateur extends Model {
    static associate(models) {
      // Un administrateur supervise plusieurs communes (hasMany)
      Administrateur.hasMany(models.Commune, {
        foreignKey: 'adminId',
        as: 'communes',
      });
    }
  }

  Administrateur.init(
    {
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      nom: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      prenom: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      postnom: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'admin',
      },
    },
    {
      sequelize,
      modelName: 'Administrateur',
      tableName: 'Administrateurs',
      timestamps: true,
    }
  );

  return Administrateur;
};