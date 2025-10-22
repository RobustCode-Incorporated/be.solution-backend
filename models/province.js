'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Province extends Model {
    static associate(models) {
      // Une province peut avoir plusieurs admins généraux
      Province.hasMany(models.AdministrateurGeneral, {
        foreignKey: 'provinceId',
        as: 'administrateursGeneraux'
      });
    }
  }

  Province.init(
    {
      nom: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      }
    },
    {
      sequelize,
      modelName: 'Province',
      tableName: 'Provinces',
      timestamps: true,
    }
  );

  return Province;
};