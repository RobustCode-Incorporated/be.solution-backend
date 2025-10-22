'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Administrateurs', 'nom', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn('Administrateurs', 'prenom', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn('Administrateurs', 'postnom', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('Administrateurs', 'nom');
    await queryInterface.removeColumn('Administrateurs', 'prenom');
    await queryInterface.removeColumn('Administrateurs', 'postnom');
  }
};