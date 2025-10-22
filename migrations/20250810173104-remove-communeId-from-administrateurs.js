'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Administrateurs', 'communeId');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Administrateurs', 'communeId', {
      type: Sequelize.INTEGER,
      allowNull: true, // ou false si tu préfères
      references: {
        model: 'Communes',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  }
};