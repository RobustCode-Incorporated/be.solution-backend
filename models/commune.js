'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Commune extends Model {
    static associate(models) {
      Commune.hasMany(models.Citoyen, { foreignKey: 'communeId' });
      Commune.hasMany(models.Administrateur, { foreignKey: 'communeId', as: 'administrateurs' });
      Commune.hasMany(models.Agent, { foreignKey: 'communeId', as: 'agents' });
      Commune.hasMany(models.Demande, { foreignKey: 'communeId' });

      Commune.belongsTo(models.Administrateur, {
        foreignKey: 'adminId',
        as: 'administrateur',
      });

      Commune.belongsTo(models.Province, {
        foreignKey: 'provinceId',
        as: 'province',
      });
    }
  }

  Commune.init(
    {
      nom: DataTypes.STRING,
      code: DataTypes.STRING,
      provinceId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      adminId: DataTypes.INTEGER
    },
    {
      sequelize,
      modelName: 'Commune',
      tableName: 'Communes',
      timestamps: true,
    }
  );

  return Commune;
};