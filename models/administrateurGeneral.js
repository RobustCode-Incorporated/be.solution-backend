'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AdministrateurGeneral extends Model {
    static associate(models) {
      AdministrateurGeneral.belongsTo(models.Province, {
        foreignKey: 'provinceId',
        as: 'province'
      });
    }
  }

  AdministrateurGeneral.init(
    {
      nom: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      prenom: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      postnom: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isEmail: true,
        },
      },
      provinceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Provinces',
          key: 'id'
        },
        unique: true // un seul admin général par province
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'admin_general',
      }
    },
    {
      sequelize,
      modelName: 'AdministrateurGeneral',
      tableName: 'AdministrateursGeneraux',
      timestamps: true,
    }
  );

  return AdministrateurGeneral;
};