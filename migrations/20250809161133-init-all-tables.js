'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1) Provinces (aucune dépendance)
    await queryInterface.createTable('Provinces', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nom: { type: Sequelize.STRING, allowNull: false, unique: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') }
    });

    // 2) Communes (sans adminId pour éviter circular FK)
    await queryInterface.createTable('Communes', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nom: { type: Sequelize.STRING, allowNull: false },
      code: { type: Sequelize.STRING, allowNull: true },
      provinceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Provinces', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') }
    });

    // 3) Administrateurs (peut faire référence à Communes)
    await queryInterface.createTable('Administrateurs', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nomComplet: { type: Sequelize.STRING, allowNull: true },
      username: { type: Sequelize.STRING, allowNull: false, unique: true },
      password: { type: Sequelize.STRING, allowNull: false },
      communeId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Communes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') }
    });

    // 4) Maintenant on peut ajouter adminId dans Communes (référence Administrateurs)
    await queryInterface.addColumn('Communes', 'adminId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Administrateurs', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // 5) AdministrateursGeneraux (dépend de Provinces)
    await queryInterface.createTable('AdministrateursGeneraux', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nomComplet: { type: Sequelize.STRING, allowNull: false },
      username: { type: Sequelize.STRING, allowNull: false, unique: true },
      password: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: true },
      provinceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Provinces', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        unique: true
      },
      role: { type: Sequelize.STRING, allowNull: false, defaultValue: 'admin_general' },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') }
    });

    // 6) Agents (dépend de Communes)
    await queryInterface.createTable('Agents', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nomComplet: { type: Sequelize.STRING, allowNull: false },
      username: { type: Sequelize.STRING, allowNull: false, unique: true },
      password: { type: Sequelize.STRING, allowNull: false },
      communeId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Communes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') }
    });

    // 7) Citoyens (dépend de Communes)
    await queryInterface.createTable('Citoyens', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nomComplet: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: true, unique: true },
      communeId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Communes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') }
    });

    // 8) Statuts (aucune dépendance)
    await queryInterface.createTable('Statuts', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nom: { type: Sequelize.STRING, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') }
    });

    // 9) Demandes (dépend de Statuts, Citoyens, Communes)
    await queryInterface.createTable('Demandes', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      description: { type: Sequelize.TEXT, allowNull: false },
      citoyenId: {
        type: Sequelize.INTEGER,
        references: { model: 'Citoyens', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      communeId: {
        type: Sequelize.INTEGER,
        references: { model: 'Communes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      statutId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Statuts', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') }
    });
  },

  async down(queryInterface) {
    // Supprimer tables dans l'ordre inverse des dépendances
    await queryInterface.dropTable('Demandes');
    await queryInterface.dropTable('Statuts');
    await queryInterface.dropTable('Citoyens');
    await queryInterface.dropTable('Agents');
    await queryInterface.dropTable('AdministrateursGeneraux');

    // Enlever la colonne adminId avant de supprimer les tables Administrateurs/Communes
    await queryInterface.removeColumn('Communes', 'adminId').catch(() => {});

    await queryInterface.dropTable('Administrateurs');
    await queryInterface.dropTable('Communes');
    await queryInterface.dropTable('Provinces');
  }
};