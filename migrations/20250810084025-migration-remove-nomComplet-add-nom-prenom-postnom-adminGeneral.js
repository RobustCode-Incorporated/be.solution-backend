'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Ajouter les colonnes nom, prenom, postnom
    await queryInterface.addColumn('AdministrateursGeneraux', 'nom', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: ''
    });

    await queryInterface.addColumn('AdministrateursGeneraux', 'prenom', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('AdministrateursGeneraux', 'postnom', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // Supprimer la colonne nomComplet
    await queryInterface.removeColumn('AdministrateursGeneraux', 'nomComplet');
  },

  async down(queryInterface, Sequelize) {
    // Restaurer nomComplet
    await queryInterface.addColumn('AdministrateursGeneraux', 'nomComplet', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    // Supprimer nom, prenom, postnom
    await queryInterface.removeColumn('AdministrateursGeneraux', 'nom');
    await queryInterface.removeColumn('AdministrateursGeneraux', 'prenom');
    await queryInterface.removeColumn('AdministrateursGeneraux', 'postnom');
  }
};