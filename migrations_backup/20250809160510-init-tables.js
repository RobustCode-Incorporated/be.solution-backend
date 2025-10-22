'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Provinces
    await queryInterface.createTable('Provinces', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nom: { type: Sequelize.STRING, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 2. Communes
    await queryInterface.createTable('Communes', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nom: { type: Sequelize.STRING, allowNull: false },
      code: { type: Sequelize.STRING },
      provinceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Provinces', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 3. Administrateurs
    await queryInterface.createTable('Administrateurs', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nomComplet: { type: Sequelize.STRING, allowNull: false },
      username: { type: Sequelize.STRING, allowNull: false, unique: true },
      password: { type: Sequelize.STRING, allowNull: false },
      communeId: {
        type: Sequelize.INTEGER,
        references: { model: 'Communes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 4. AdministrateursGeneraux
    await queryInterface.createTable('AdministrateursGeneraux', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nomComplet: { type: Sequelize.STRING, allowNull: false },
      username: { type: Sequelize.STRING, allowNull: false, unique: true },
      password: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING },
      provinceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Provinces', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        unique: true
      },
      role: { type: Sequelize.STRING, allowNull: false, defaultValue: 'admin_general' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 5. Agents
    await queryInterface.createTable('Agents', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nomComplet: { type: Sequelize.STRING, allowNull: false },
      username: { type: Sequelize.STRING, allowNull: false, unique: true },
      password: { type: Sequelize.STRING, allowNull: false },
      communeId: {
        type: Sequelize.INTEGER,
        references: { model: 'Communes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 6. Citoyens
    await queryInterface.createTable('Citoyens', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nomComplet: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, unique: true },
      communeId: {
        type: Sequelize.INTEGER,
        references: { model: 'Communes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 7. Statuts
    await queryInterface.createTable('Statuts', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nom: { type: Sequelize.STRING, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 8. Demandes
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
        references: { model: 'Statuts', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Demandes');
    await queryInterface.dropTable('Statuts');
    await queryInterface.dropTable('Citoyens');
    await queryInterface.dropTable('Agents');
    await queryInterface.dropTable('AdministrateursGeneraux');
    await queryInterface.dropTable('Administrateurs');
    await queryInterface.dropTable('Communes');
    await queryInterface.dropTable('Provinces');
  }
};