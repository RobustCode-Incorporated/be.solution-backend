'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1) Insert provinces
    const provinceNames = [
      'Kinshasa','Haut-Katanga','Lualaba','Ituri','Nord-Kivu','Sud-Kivu','Tshopo',
      'Haut-Uele','Bas-Uele','Tanganyika','Maniema','Mongala','Tshuapa','Équateur',
      'Mai-Ndombe','Kwilu','Kwango','Kasaï','Kasaï-Central','Kasaï-Oriental',
      'Lomami','Sankuru','Haut-Lomami','Sud-Ubangi','Nord-Ubangi','Tanganika'
    ];

    const now = new Date();
    const provinceObjects = provinceNames.map(n => ({ nom: n, createdAt: now, updatedAt: now }));
    await queryInterface.bulkInsert('Provinces', provinceObjects, {});

    // 2) Récupérer les ids des provinces insérées (attention à la casse dans le SQL)
    const [provincesRows] = await queryInterface.sequelize.query(
      `SELECT id, nom FROM "Provinces" WHERE nom IN (${provinceNames.map(() => '?').join(',')})`,
      { replacements: provinceNames }
    );

    const provincesByName = {};
    provincesRows.forEach(r => provincesByName[r.nom] = r.id);

    // 3) Insert communes pour Kinshasa (exemple)
    const communesKinshasa = [
      'Barumbu', 'Gombe', 'Kinshasa', 'Kintambo', 'Lingwala', 'Kalamu',
      'Kasa-Vubu', 'Bandalungwa', 'Ngiri-Ngiri', 'Selembao', 'Bumbu',
      'Makala', 'Ngaba', 'Lemba', 'Matete', 'Kisenso', 'Mont Ngafula',
      'Ngaliema', 'Masina', 'Kimbanseke', 'Ndjili', 'Nsele', 'Maluku', 'Limete'
    ];

    const communeObjects = communesKinshasa.map((nom, idx) => ({
      nom,
      code: `KIN-${idx+1}`,
      provinceId: provincesByName['Kinshasa'],
      createdAt: now,
      updatedAt: now
    }));

    await queryInterface.bulkInsert('Communes', communeObjects, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Communes', null, {});
    await queryInterface.bulkDelete('Provinces', null, {});
  }
};