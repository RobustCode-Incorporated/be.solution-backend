'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Provinces
    await queryInterface.createTable('Provinces', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      nom: { type: Sequelize.STRING, allowNull: false, unique: true },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    // 2. Communes
    await queryInterface.createTable('Communes', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      nom: { type: Sequelize.STRING, allowNull: false },
      code: { type: Sequelize.STRING },
      provinceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Provinces', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      adminId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Administrateurs', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    // 3. Administrateurs
    await queryInterface.createTable('Administrateurs', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      nomComplet: Sequelize.STRING,
      username: { type: Sequelize.STRING, unique: true },
      password: Sequelize.STRING,
      communeId: {
        type: Sequelize.INTEGER,
        references: { model: 'Communes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    // 4. AdministrateursGeneraux
    await queryInterface.createTable('AdministrateursGeneraux', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      nomComplet: Sequelize.STRING,
      username: { type: Sequelize.STRING, unique: true },
      password: Sequelize.STRING,
      email: Sequelize.STRING,
      provinceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Provinces', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        unique: true,
      },
      role: { type: Sequelize.STRING, allowNull: false, defaultValue: 'admin_general' },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    // 5. Agents
    await queryInterface.createTable('Agents', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      nomComplet: Sequelize.STRING,
      username: { type: Sequelize.STRING, unique: true },
      password: Sequelize.STRING,
      communeId: {
        type: Sequelize.INTEGER,
        references: { model: 'Communes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    // 6. Citoyens
    await queryInterface.createTable('Citoyens', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      nomComplet: Sequelize.STRING,
      email: Sequelize.STRING,
      telephone: Sequelize.STRING,
      communeId: {
        type: Sequelize.INTEGER,
        references: { model: 'Communes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    // 7. Statuts
    await queryInterface.createTable('Statuts', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      nom: Sequelize.STRING,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    // 8. Demandes
    await queryInterface.createTable('Demandes', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      typeDocument: Sequelize.STRING,
      statutId: {
        type: Sequelize.INTEGER,
        references: { model: 'Statuts', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      citoyenId: {
        type: Sequelize.INTEGER,
        references: { model: 'Citoyens', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      communeId: {
        type: Sequelize.INTEGER,
        references: { model: 'Communes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
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
  },
};