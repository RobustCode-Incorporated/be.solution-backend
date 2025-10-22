'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Administrateurs', 'nom', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Administrateurs', 'prenom', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Administrateurs', 'postnom', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Administrateurs', 'nom');
    await queryInterface.removeColumn('Administrateurs', 'prenom');
    await queryInterface.removeColumn('Administrateurs', 'postnom');
  }
};