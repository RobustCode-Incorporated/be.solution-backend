// Helper function for Annexe 26 digital template
function generateAnnexe26Template(data) {
  return {
    documentType: "ANNEXE_26",
    dossierNumber: data.nuc,
    title: "Attestation de demande de protection internationale",
    notice: "Document informatif – version numérique",
    identity: {
      nom: data.nom,
      prenom: data.prenom,
      dateNaissance: data.dateNaissance,
      lieuNaissance: data.lieuNaissance,
      nationalite: data.nationalite,
      langueProcedure: data.langue || "français"
    },
    travelDocuments: {
      passport: {
        numero: data.passportNumber,
        dateDebut: data.passportStart,
        dateFin: data.passportEnd
      },
      visa: {
        numero: data.visaNumber,
        dateDebut: data.visaStart,
        dateFin: data.visaEnd
      }
    },
    procedure: {
      dateArrivee: data.dateArrivee,
      dateDemande: data.dateDemande,
      lieuDemande: data.lieuDemande || "Belgique",
      domicileElection: data.domicileElection || "CGRA – Bruxelles"
    },
    convocation: {
      date: data.dateConvocation,
      heure: data.heureConvocation,
      lieu: data.lieuConvocation
    },
    legalNotice: [
      "Ce document ne constitue ni un titre d’identité ni un titre de séjour.",
      "Il est destiné à un usage administratif et informatif.",
      "Les données personnelles sont traitées conformément à la législation en vigueur relative à la protection des données.",
      "Les communications officielles seront envoyées à l’adresse déclarée ou, à défaut, à l’adresse administrative de référence."
    ],
    generatedAt: new Date().toISOString()
  };
}
// controllers/demandeController.js
const { Demande, Citoyen, Statut, Agent, Commune, Province, Administrateur } = require('../models');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const { v4: uuidv4 } = require('uuid');
const qrcode = require('qrcode');
const multer = require('multer');
const upload = multer({ dest: path.join(__dirname, '..', 'public', 'uploads') });

const DOCUMENTS_DIR = path.join(__dirname, '..', 'documents');
const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads');

fs.mkdir(UPLOADS_DIR, { recursive: true }).catch(console.error);
// Fonction utilitaire pour obtenir l'ID d'un statut par son nom
const getStatutIdByName = async (name) => {
  const statut = await Statut.findOne({ where: { nom: name } });
  return statut ? statut.id : null;
};

module.exports = {
  async getAllDemandes(req, res) {
    try {
      let whereClause = {};
      if (req.user && req.user.role === 'admin' && req.user.communeId) {
        whereClause = { communeId: req.user.communeId };
      }
      const demandes = await Demande.findAll({
        where: whereClause,
        include: [
          { model: Citoyen, as: 'citoyen' },
          { model: Statut, as: 'statut' },
          { model: Agent, as: 'agent' }
        ],
        order: [['createdAt', 'DESC']]
      });
      res.json(demandes);
    } catch (error) {
      console.error('Erreur getAllDemandes:', error);
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  },
  async getDemandeById(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ message: "ID invalide" });
      const demande = await Demande.findByPk(id, {
        include: [
          { model: Citoyen, as: 'citoyen' },
          { model: Statut, as: 'statut' },
          { model: Agent, as: 'agent' }
        ]
      });
      if (!demande) return res.status(404).json({ message: 'Demande non trouvée' });
      res.json(demande);
    } catch (error) {
      console.error('Erreur getDemandeById:', error);
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  },
  async createDemande(req, res) {
    try {
      // Transforme donneesJson en string si c'est un objet ou tableau
      if (req.body.donneesJson && typeof req.body.donneesJson !== 'string') {
        req.body.donneesJson = JSON.stringify(req.body.donneesJson);
      }
      const demande = await Demande.create(req.body);

      // If Annexe 26 / demande creation, build and return the neutral digital template
      // Try to get user/citoyen and build annexe26 if possible
      let annexe26 = null;
      // This logic assumes req.body contains required fields or can be built from demande
      // Try to find the user/citoyen if possible
      let user = null;
      if (demande.citoyenId) {
        user = await Citoyen.findByPk(demande.citoyenId);
      }
      // Fallback: try from req.body if not in DB
      if (!user && req.body.citoyenId) {
        user = await Citoyen.findByPk(req.body.citoyenId);
      }
      // If user found AND demande has Annexe 26/attestation context (e.g. typeDemande === 'annexe_26' or similar), return the template
      // For this patch, if user and demande exist, always return the template (adjust as needed for your logic)
      if (user && demande) {
        // Use demande.id as nuc if no other field
        const nuc = demande.id || null;
        annexe26 = generateAnnexe26Template({
          nuc,
          nom: user.nom,
          prenom: user.prenom,
          dateNaissance: user.dateNaissance,
          lieuNaissance: user.lieuNaissance,
          nationalite: user.nationalite,
          langue: user.langue,
          passportNumber: user.passportNumber,
          passportStart: user.passportStart,
          passportEnd: user.passportEnd,
          visaNumber: user.visaNumber,
          visaStart: user.visaStart,
          visaEnd: user.visaEnd,
          dateArrivee: user.dateArrivee,
          dateDemande: new Date().toISOString().split("T")[0],
          domicileElection: "CGRA – Bruxelles",
          dateConvocation: demande.dateConvocation,
          heureConvocation: demande.heureConvocation,
          lieuConvocation: demande.lieuConvocation
        });
        return res.status(201).json({
          success: true,
          annexe26
        });
      }

      // fallback: normal response if not an Annexe 26 context
      res.status(201).json(demande);
    } catch (error) {
      console.error('Erreur createDemande:', error);
      res.status(400).json({ message: 'Erreur création demande', error: error.message });
    }
  },
  async updateDemande(req, res) {
    try {
      const demande = await Demande.findByPk(req.params.id);
      if (!demande) return res.status(404).json({ message: 'Demande non trouvée' });
      await demande.update(req.body);
      res.json(demande);
    } catch (error) {
      console.error('Erreur updateDemande:', error);
      res.status(400).json({ message: 'Erreur mise à jour', error: error.message });
    }
  },
  async deleteDemande(req, res) {
    try {
      const demande = await Demande.findByPk(req.params.id);
      if (!demande) return res.status(404).json({ message: 'Demande non trouvée' });
      await demande.destroy();
      res.status(204).send();
    } catch (error) {
      console.error('Erreur deleteDemande:', error);
      res.status(400).json({ message: 'Erreur suppression', error: error.message });
    }
  },
  async getMyDemandes(req, res) {
    try {
      if (!req.user || req.user.role !== 'citoyen') {
        return res.status(403).json({ message: 'Accès interdit : rôle insuffisant' });
      }
      const demandes = await Demande.findAll({
        where: { citoyenId: req.user.id },
        include: [{ model: Statut, as: 'statut' }],
        order: [['createdAt', 'DESC']]
      });
      res.json(demandes);
    } catch (error) {
      console.error('Erreur getMyDemandes:', error);
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  },
  async getDemandesToValidate(req, res) {
    try {
      const demandes = await Demande.findAll({
        include: [
          { model: Citoyen, as: 'citoyen' },
          { model: Statut, as: 'statut', where: { nom: 'en traitement' } },
          { model: Agent, as: 'agent' }
        ],
        order: [['createdAt', 'DESC']]
      });
      res.json(demandes);
    } catch (error) {
      console.error('Erreur getDemandesToValidate:', error);
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  },
  async uploadImage(req, res) {
    upload.single('photo')(req, res, async (err) => {
      if (err) {
        console.error('Erreur lors de l\'upload du fichier:', err);
        return res.status(500).json({ message: 'Échec de l\'upload du fichier.', error: err.message });
      }
      if (!req.file) {
        return res.status(400).json({ message: 'Aucun fichier photo fourni.' });
      }
      try {
        const uniqueFilename = `${uuidv4()}${path.extname(req.file.originalname)}`;
        const destinationPath = path.join(UPLOADS_DIR, uniqueFilename);
        await fs.rename(req.file.path, destinationPath);
        const photoUrl = `${req.protocol}://${req.get('host')}/uploads/${uniqueFilename}`;
        res.status(200).json({ url: photoUrl });
      } catch (error) {
        console.error('Erreur lors du déplacement ou de la gestion du fichier uploadé:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la gestion de l\'upload.', error: error.message });
      }
    });
  },
  async generateDocument(req, res) {
    // --- Version harmonisée Rdcgov, Puppeteer + @sparticuz/chromium, logs, QR, signature dynamique ---
    console.log('--- Appel de la fonction generateDocument ---');
    let demande;
    try {
      const { id } = req.params;
      console.log(`Tentative de génération de document pour la demande ID: ${id}`);
      demande = await Demande.findByPk(id, {
        include: [
          {
            model: Citoyen,
            as: 'citoyen',
            include: [{ model: Commune, as: 'commune' }]
          },
          { model: Agent, as: 'agent' },
          { model: Statut, as: 'statut' }
        ]
      });
      if (!demande) {
        console.error(`Erreur: Demande non trouvée pour l'ID: ${id}`);
        return res.status(404).json({ message: "Demande introuvable" });
      }
      console.log('Demande trouvée:', demande.typeDemande);
      console.log('Statut actuel de la demande:', demande.statut?.nom);
      console.log('Citoyen attaché:', demande.citoyen?.nom, demande.citoyen?.prenom);
      console.log('Commune du citoyen:', demande.citoyen?.commune?.nom);
      await fs.mkdir(DOCUMENTS_DIR, { recursive: true });
      console.log('Dossier documents vérifié/créé.');
      const citoyen = demande.citoyen;
      const donneesDemande = JSON.parse(demande.donneesJson || '{}');
      const BASE_URL = process.env.RENDER_EXTERNAL_URL || 'https://ma-commune-backend.onrender.com';
      let photoUrl = null;
      if (donneesDemande.photoUrl) {
        photoUrl = donneesDemande.photoUrl.replace('http://localhost:4000', BASE_URL).replace('https://localhost:4000', BASE_URL);
      }
      const typeDemande = demande.typeDemande;
      let htmlContent = '';
      const currentDate = new Date().toLocaleDateString("fr-FR");
      const verificationToken = uuidv4();
      const verificationUrl = `http://localhost:4000/verify-document?token=${verificationToken}`;
      const qrCodeDataURL = await qrcode.toDataURL(verificationUrl);
      console.log('Token et QR Code générés.');
      let communeNaissanceEnfant = null;
      let provinceNaissanceEnfant = null;
      if (donneesDemande.communeNaissanceEnfantId) {
        communeNaissanceEnfant = await Commune.findByPk(donneesDemande.communeNaissanceEnfantId);
        console.log('Commune Naissance Enfant trouvée:', communeNaissanceEnfant?.nom);
      }
      if (donneesDemande.provinceNaissanceEnfantId) {
        provinceNaissanceEnfant = await Province.findByPk(donneesDemande.provinceNaissanceEnfantId);
        console.log('Province Naissance Enfant trouvée:', provinceNaissanceEnfant?.nom);
      }
      console.log('DEBUG: Citoyen Commune:', citoyen.commune?.nom);
      console.log('DEBUG: Donnees Demande:', donneesDemande);
      console.log('DEBUG: Commune Naissance Enfant:', communeNaissanceEnfant?.nom);
      console.log('DEBUG: Province Naissance Enfant:', provinceNaissanceEnfant?.nom);
      // Charger le logo en base64 ou utiliser l'URL publique Render si non trouvé
      const logoPath = path.join(__dirname, '..', 'public', 'assets', 'images', 'app_logo.png');
      let logoBase64 = '';
      try {
        const logoBuffer = await fs.readFile(logoPath);
        logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
      } catch (e) {
        console.warn('Logo local introuvable, utilisation du logo hébergé sur Render.');
        const BASE_URL = process.env.RENDER_EXTERNAL_URL || 'https://ma-commune-backend.onrender.com';
        const publicLogoUrl = `${BASE_URL}/public/assets/images/app_logo.png`;
        logoBase64 = publicLogoUrl;
      }
      const baseSignatureBlock = `
        <div class="signature-section" style="text-align: right; margin-top: 50px;">
          <p>Le Bourgmestre</p>
          <p>_________________________</p>
          <p>Signature (Numérique)</p>
        </div>
        <div class="qr-code" style="text-align: center; margin-top: 30px;">
          <img src="${qrCodeDataURL}" alt="QR Code de vérification" width="100" height="100">
        </div>
        <p class="verification-link" style="text-align: center; font-size: 0.9em; margin-top: 10px; color: #555;">Vérifiez l'authenticité : <a href="${verificationUrl}">${verificationUrl}</a></p>
      `;
      // Gabarits HTML par type
      switch (typeDemande) {
        case 'acte_naissance':
          htmlContent = `
            <style>
  body { font-family: Cooper Hewitt, Garamond; margin: 40px; display: flex; flex-direction: column; min-height: 100vh; }
  h1 { color: #003da5; text-align: center; }
  .header-with-image {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    padding-bottom: 10px;
  }
  .header-image {
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 80px;
  }
  .header-text {
    flex-grow: 1;
    text-align: center;
    font-size: 12px;
    line-height: 1.2;
  }
  .header-line {
    position: absolute;
    bottom: -5px;
    left: 0;
    width: 100%;
    border-bottom: 1px solid #ccc;
  }
  .content {
    font-size: 13px;
    text-align: justify;
    margin-top: 10px;
    margin-bottom: 10px;
    line-height: 1.4;
  }
  .footer-line {
    height: 3px;
    width: 100%;
    background: linear-gradient(to right, #0095c9 0%, #0095c9 33.33%, #fff24b 33.33%, #fff24b 66.66%, #db3832 66.66%, #db3832 100%);
    margin-top: 15px;
  }
</style>
<body>
  <div class="header-with-image">
    <img src="${logoBase64}" alt="Logo" class="header-image">
    <div class="header-text">
      <h3>RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</h3>
      <p>PROVINCE DE KINSHASA</p>
      <p>COMMUNE DE ${citoyen.commune?.nom?.toUpperCase() || 'XXX'}</p>
    </div>
    <div class="header-line"></div>
  </div>
  <h1>ACTE DE NAISSANCE</h1>
  <div class="content">
    <p>Je soussigné, le Bourgmestre de la commune de ${citoyen.commune?.nom || 'XXX'},</p>
    <p>atteste que l'enfant :</p>
    <p><strong>Nom :</strong> ${donneesDemande.nomEnfant || 'N/A'}</p>
    <p><strong>Postnom :</strong> ${donneesDemande.postnomEnfant || 'N/A'}</p>
    <p><strong>Prénom :</strong> ${donneesDemande.prenomEnfant || 'N/A'}</p>
    <p><strong>Sexe :</strong> ${donneesDemande.sexeEnfant || 'N/A'}</p>
    <p><strong>Né(e) le :</strong> ${donneesDemande.dateNaissanceEnfant ? new Date(donneesDemande.dateNaissanceEnfant).toLocaleDateString("fr-FR") : 'N/A'}</p>
    <p><strong>Lieu de naissance :</strong> ${donneesDemande.lieuNaissanceEnfant || 'N/A'}, ${communeNaissanceEnfant?.nom || ''}, ${provinceNaissanceEnfant?.nom || ''}</p>
    <p><strong>Père :</strong> ${donneesDemande.prenomPere || 'N/A'} ${donneesDemande.nomPere || 'N/A'}</p>
    <p><strong>Mère :</strong> ${donneesDemande.prenomMere || 'N/A'} ${donneesDemande.nomMere || 'N/A'}</p>
    <p>Délivré à Kinshasa, le ${currentDate}.</p>
  </div>
  ${baseSignatureBlock}
  <div class="footer-line"></div>
</body>
          `;
          break;
        case 'acte_mariage':
          htmlContent = `
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              h1 { color: #003da5; text-align: center; }
              .header-with-image {
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                padding-bottom: 10px;
              }
              .header-image {
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
                width: 80px;
              }
              .header-text {
                flex-grow: 1;
                text-align: center;
                font-size: 12px;
                line-height: 1.2;
              }
              .header-line {
                position: absolute;
                bottom: -5px;
                left: 0;
                width: 100%;
                border-bottom: 1px solid #ccc;
              }
              .content {
                font-size: 13px;
                text-align: justify;
                margin-top: 10px;
                margin-bottom: 10px;
                line-height: 1.4;
              }
              .footer-line {
                height: 3px;
                width: 100%;
                background: linear-gradient(to right, #0095c9 0%, #0095c9 33.33%, #fff24b 33.33%, #fff24b 66.66%, #db3832 66.66%, #db3832 100%);
                margin-top: 15px;
              }
            </style>
            <body>
              <div class="header-with-image">
                <img src="${logoBase64}" alt="Logo" class="header-image">
                <div class="header-text">
                  <h3>RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</h3>
                  <p>PROVINCE DE KINSHASA</p>
                  <p>COMMUNE DE ${citoyen.commune?.nom?.toUpperCase() || 'XXX'}</p>
                </div>
                <div class="header-line"></div>
              </div>
              <h1>ACTE DE MARIAGE</h1>
              <div class="content">
                <p>Le mariage entre :</p>
                <p>
                  <strong>Époux :</strong> ${citoyen.nom || 'N/A'} ${citoyen.postnom ? (citoyen.postnom + ' ') : ''}${citoyen.prenom || 'N/A'}
                </p>
                <p>
                  <strong>Épouse :</strong> ${donneesDemande.nomConjoint || 'N/A'} ${donneesDemande.postnomConjoint ? (donneesDemande.postnomConjoint + ' ') : ''}${donneesDemande.prenomConjoint || 'N/A'}
                </p>
                <p>a été célébré le ${donneesDemande.dateMariage ? new Date(donneesDemande.dateMariage).toLocaleDateString("fr-FR") : 'N/A'} dans notre commune.</p>
                <p>Délivré à Kinshasa, le ${currentDate}.</p>
              </div>
              ${baseSignatureBlock}
              <div class="footer-line"></div>
            </body>
          `;
          break;
        case 'acte_residence':
          htmlContent = `
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              h1 { color: #003da5; text-align: center; }
              .header-with-image {
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                padding-bottom: 10px;
              }
              .header-image {
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
                width: 80px;
              }
              .header-text {
                flex-grow: 1;
                text-align: center;
                font-size: 12px;
                line-height: 1.2;
              }
              .header-line {
                position: absolute;
                bottom: -5px;
                left: 0;
                width: 100%;
                border-bottom: 1px solid #ccc;
              }
              .content {
                font-size: 13px;
                text-align: justify;
                margin-top: 10px;
                margin-bottom: 10px;
                line-height: 1.4;
              }
              .footer-line {
                height: 3px;
                width: 100%;
                background: linear-gradient(to right, #0095c9 0%, #0095c9 33.33%, #fff24b 33.33%, #fff24b 66.66%, #db3832 66.66%, #db3832 100%);
                margin-top: 15px;
              }
            </style>
            <body>
              <div class="header-with-image">
                <img src="${logoBase64}" alt="Logo" class="header-image">
                <div class="header-text">
                  <h3>RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</h3>
                  <p>PROVINCE DE KINSHASA</p>
                  <p>COMMUNE DE ${citoyen.commune?.nom?.toUpperCase() || 'XXX'}</p>
                </div>
                <div class="header-line"></div>
              </div>
              <h1>CERTIFICAT DE RÉSIDENCE</h1>
              <div class="content">
                <p>Je soussigné, le Bourgmestre de la commune de ${citoyen.commune?.nom || 'XXX'},</p>
                <p>atteste que le citoyen :</p>
                <p><strong>Nom :</strong> ${citoyen.nom || 'N/A'}</p>
                <p><strong>Postnom :</strong> ${citoyen.postnom || 'N/A'}</p>
                <p><strong>Prénom :</strong> ${citoyen.prenom || 'N/A'}</p>
                <p><strong>Réside à :</strong> ${donneesDemande.adresseComplete || 'N/A'}, ${citoyen.commune?.nom || 'XXX'}, Kinshasa.</p>
                <p>Délivré à Kinshasa, le ${currentDate}.</p>
              </div>
              ${baseSignatureBlock}
              <div class="footer-line"></div>
            </body>
          `;
          break;
        case 'carte_identite':
          htmlContent = `
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                background: #f0f0f0;
              }
              .id-card {
                width: 336px;
                height: 204px;
                border: 1px solid #003da5;
                border-radius: 10px;
                background: #fff;
                box-shadow: 2px 2px 6px rgba(0,0,0,0.2);
                display: flex;
                flex-direction: column;
                padding: 6px;
                box-sizing: border-box;
                position: relative;
              }
              .header-with-image {
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                margin-bottom: 4px;
              }
              .header-image {
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
                width: 28px;
              }
              .header-text {
                font-size: 8px;
                line-height: 1.2;
                text-align: center;
                flex-grow: 1;
              }
              .header-text h3 {
                margin: 0;
                font-size: 9px;
                color: #003da5;
              }
              .card-body {
                display: flex;
                flex: 1;
              }
              .card-left {
                flex: 1;
                text-align: center;
              }
              .card-right {
                flex: 2;
                font-size: 9px;
                line-height: 1.2;
                padding-left: 6px;
              }
              .profile-pic {
                width: 70px;
                height: 70px;
                border-radius: 5px;
                object-fit: cover;
                border: 1px solid #003da5;
                margin-bottom: 6px;
              }
              .qr-code img {
                width: 55px;
                height: 55px;
                margin-top: 4px;
              }
              .card-info p {
                margin: 1px 0;
              }
              .signature {
                font-size: 8px;
                text-align: right;
                margin-top: 4px;
                font-family: 'Brush Script MT', 'Lucida Handwriting', cursive;
              }
              .footer-line {
                position: absolute;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 3px;
                background: linear-gradient(to right, #0095c9 0%, #0095c9 33.33%, #fff24b 33.33%, #fff24b 66.66%, #db3832 66.66%, #db3832 100%);
                border-bottom-left-radius: 10px;
                border-bottom-right-radius: 10px;
                margin: 0;
              }
            </style>
            <body>
              <div class="id-card">
                <div class="header-with-image">
                  <img src="${logoBase64}" alt="Logo" class="header-image">
                  <div class="header-text">
                    <h3>RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</h3>
                    <p>COMMUNE DE ${citoyen.commune?.nom?.toUpperCase() || 'XXX'}</p>
                  </div>
                </div>
                <div class="card-body">
                  <div class="card-left">
                    <img src="${photoUrl || 'https://placehold.co/70x70/003DA5/FFFFFF?text=PHOTO'}" alt="Photo de profil" class="profile-pic">
                    <div class="qr-code">
                      <img src="${qrCodeDataURL}" alt="QR Code">
                    </div>
                  </div>
                  <div class="card-right">
                    <div class="card-info">
                      <p><strong>Nom :</strong> ${citoyen.nom || 'N/A'}</p>
                      <p><strong>Postnom :</strong> ${citoyen.postnom || 'N/A'}</p>
                      <p><strong>Prénom :</strong> ${citoyen.prenom || 'N/A'}</p>
                      <p><strong>Né(e) le :</strong> ${citoyen.dateNaissance ? new Date(citoyen.dateNaissance).toLocaleDateString("fr-FR") : 'N/A'}</p>
                      <p><strong>Sexe :</strong> ${citoyen.sexe || 'N/A'}</p>
                      <p><strong>Lieu :</strong> ${citoyen.lieuNaissance || 'N/A'}</p>
                      <p><strong>N° Unique :</strong> ${citoyen.numeroUnique || 'N/A'}</p>
                      <p><strong>Délivrée le :</strong> ${currentDate}</p>
                    </div>
                    <div class="signature">
                      <p>Le Bourgmestre</p>
                    </div>
                  </div>
                </div>
                <div class="footer-line"></div>
              </div>
            </body>
          `;
          break;
        default:
          htmlContent = `
            <body>
              <h1>Document Non Standard</h1>
              <p>Type de document non reconnu ou template non disponible.</p>
              <p>ID Demande: ${demande.id}</p>
              <p>Type: ${demande.typeDemande}</p>
              <p>Délivré à Kinshasa, le ${currentDate}.</p>
              ${baseSignatureBlock}
            </body>
          `;
      }
      console.log('HTML Content ready. Launching Puppeteer...');
      const browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
        timeout: 120000,
      });
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0', timeout: 120000 });
      console.log('Page content set.');
      const filename = `${typeDemande}_${demande.id}_${verificationToken}.pdf`;
      const pdfPath = path.join(DOCUMENTS_DIR, filename);
      await fs.mkdir(DOCUMENTS_DIR, { recursive: true }).catch(err => {
        console.error("Erreur lors de la création du dossier 'documents':", err);
      });
      console.log(`Tentative de génération du PDF vers: ${pdfPath}`);
      await page.pdf({ path: pdfPath, format: 'A4', printBackground: true, timeout: 120000 });
      console.log('PDF généré avec succès.');
      await browser.close();
      console.log('Navigateur Puppeteer fermé.');
      await demande.update({
        documentPath: filename,
        verificationToken: verificationToken
      });
      console.log('Demande mise à jour en base de données avec documentPath et verificationToken.');
      res.json({
        message: "Document généré avec succès pour la validation.",
        documentUrl: `${filename}`,
        verificationUrl: verificationUrl
      });
      console.log('--- Fin de la fonction generateDocument (Succès) ---');
    } catch (error) {
      console.error("Erreur génération document:", error);
      if (demande && typeof demande.update === "function") {
        await demande.update({
          documentPath: null,
          verificationToken: null
        }).catch(dbErr => {
          console.error("Erreur lors de la mise à jour de la demande après échec de génération:", dbErr);
        });
      }
      return res.status(500).json({ message: "Erreur lors de la génération du document", error: error.message });
    }
  },
  async validateDocument(req, res) {
    console.log('--- Appel de la fonction validateDocument (Signature) ---');
    try {
      const { id } = req.params;
      const demande = await Demande.findByPk(id, {
        include: [
          {
            model: Citoyen,
            as: 'citoyen',
            include: [{ model: Commune, as: 'commune' }]
          },
          { model: Agent, as: 'agent' },
          { model: Statut, as: 'statut' }
        ]
      });
      if (!demande) {
        console.error(`Erreur: Demande non trouvée pour l'ID: ${id}`);
        return res.status(404).json({ message: "Demande non trouvée." });
      }
      if (demande.statut.nom !== 'en traitement') {
        console.error(`Erreur: Statut de la demande (${demande.statut.nom}) n'est pas 'en traitement'.`);
        return res.status(400).json({ message: "La demande ne peut être validée que si elle est 'en traitement'." });
      }
      if (!demande.documentPath || !demande.verificationToken) {
        console.error("Erreur: Aucun document généré ou jeton de vérification pour cette demande.");
        return res.status(400).json({ message: "Aucun document généré pour cette demande." });
      }
      const citoyen = demande.citoyen;
      const donneesDemande = JSON.parse(demande.donneesJson || '{}');
      const BASE_URL = process.env.RENDER_EXTERNAL_URL || 'https://ma-commune-backend.onrender.com';
      let photoUrl = null;
      if (donneesDemande.photoUrl) {
        photoUrl = donneesDemande.photoUrl.replace('http://localhost:4000', BASE_URL).replace('https://localhost:4000', BASE_URL);
      }
      const typeDemande = demande.typeDemande;
      const currentDate = new Date().toLocaleDateString("fr-FR");
      const logoPath = path.join(__dirname, '..', 'public', 'assets', 'images', 'app_logo.png');
      let logoBase64 = '';
      try {
        const logoBuffer = await fs.readFile(logoPath);
        logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
      } catch (e) {
        console.warn('Logo local introuvable, utilisation du logo hébergé sur Render.');
        const BASE_URL = process.env.RENDER_EXTERNAL_URL || 'https://ma-commune-backend.onrender.com';
        const publicLogoUrl = `${BASE_URL}/public/assets/images/app_logo.png`;
        logoBase64 = publicLogoUrl;
      }
      let bourgmestreName = 'Nom du Bourgmestre (Fallback)';
      console.log('DEBUG_AUTH: Contenu de req.user:', req.user);
      if (req.user && req.user.role === 'admin') {
        const bourgmestre = await Administrateur.findByPk(req.user.id);
        console.log('DEBUG_AUTH: Administrateur trouvé par req.user.id:', bourgmestre ? bourgmestre.toJSON() : 'Non trouvé');
        if (bourgmestre) {
          const prenom = bourgmestre.prenom || '';
          const nom = bourgmestre.nom || '';
          bourgmestreName = `${prenom} ${nom}`.trim();
          if (!bourgmestreName) {
              bourgmestreName = 'Le Bourgmestre (Prénom/Nom vide dans Administrateur)';
          }
        } else {
            console.log('DEBUG_AUTH: Aucun administrateur trouvé pour req.user.id:', req.user.id);
            bourgmestreName = 'Le Bourgmestre (ID Admin non trouvé)';
        }
      } else {
        console.log('DEBUG_AUTH: Utilisateur non connecté comme bourgmestre ou rôle incorrect. Rôle:', req.user?.role || 'N/A');
        bourgmestreName = 'Nom du Bourgmestre (Non Authentifié)';
      }
      console.log('DEBUG_AUTH: Nom final du Bourgmestre pour signature:', bourgmestreName);
      const verificationToken = demande.verificationToken;
      const verificationUrl = `http://localhost:4000/verify-document?token=${verificationToken}`;
      const qrCodeDataURL = await qrcode.toDataURL(verificationUrl);
      console.log('Jeton de vérification et QR Code réutilisés.');
      let communeNaissanceEnfant = null;
      let provinceNaissanceEnfant = null;
      if (donneesDemande.communeNaissanceEnfantId) {
        communeNaissanceEnfant = await Commune.findByPk(donneesDemande.communeNaissanceEnfantId);
      }
      if (donneesDemande.provinceNaissanceEnfantId) {
        provinceNaissanceEnfant = await Province.findByPk(donneesDemande.provinceNaissanceEnfantId);
      }
      let htmlContent = '';
      const signatureBlockSigned = `
        <div class="signature-section" style="text-align: right; margin-top: 50px;">
          <p>Le Bourgmestre</p>
          <p class="bourgmestre-name" style="font-family: 'Brush Script MT', 'Lucida Handwriting', cursive; font-size: 1.4em; margin-top: 5px; font-weight: bold; color: #000;">
            ${bourgmestreName}
          </p>
        </div>
        <div class="qr-code" style="text-align: center; margin-top: 30px;">
          <img src="${qrCodeDataURL}" alt="QR Code de vérification" width="100" height="100">
        </div>
        <p class="verification-link" style="text-align: center; font-size: 0.9em; margin-top: 10px; color: #555;">Vérifiez l'authenticité : <a href="${verificationUrl}">${verificationUrl}</a></p>
      `;
      switch (typeDemande) {
        case 'acte_naissance':
          htmlContent = `
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              h1 { color: #003da5; text-align: center; }
              .header-with-image {
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                padding-bottom: 10px;
              }
              .header-image {
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
                width: 80px;
              }
              .header-text {
                flex-grow: 1;
                text-align: center;
              }
              .header-line {
                position: absolute;
                bottom: 0;
                left: 0;
                width: 100%;
                border-bottom: 1px solid #ccc;
              }
              .content {
                margin-top: 30px;
                line-height: 1.6;
                flex-grow: 1;
              }
              .bourgmestre-name {
                font-family: 'Brush Script MT', 'Lucida Handwriting', cursive;
                font-size: 1.4em;
                margin-top: 5px;
                font-weight: bold;
                color: #000;
              }
              .footer-line {
                height: 3px;
                width: 100%;
                background: linear-gradient(to right, #0095c9 0%, #0095c9 33.33%, #fff24b 33.33%, #fff24b 66.66%, #db3832 66.66%, #db3832 100%);
                margin-top: 15px;
              }
            </style>
            <body>
              <div class="header-with-image">
                <img src="${logoBase64}" alt="Logo" class="header-image">
                <div class="header-text">
                  <h3>RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</h3>
                  <p>PROVINCE DE KINSHASA</p>
                  <p>COMMUNE DE ${citoyen.commune?.nom?.toUpperCase() || 'XXX'}</p>
                </div>
                <div class="header-line"></div>
              </div>
              <h1>ACTE DE NAISSANCE</h1>
              <div class="content">
                <p>Je soussigné, le Bourgmestre de la commune de ${citoyen.commune?.nom || 'XXX'},</p>
                <p>atteste que l'enfant :</p>
                <p><strong>Nom :</strong> ${donneesDemande.nomEnfant || 'N/A'}</p>
                <p><strong>Postnom :</strong> ${donneesDemande.postnomEnfant || 'N/A'}</p>
                <p><strong>Prénom :</strong> ${donneesDemande.prenomEnfant || 'N/A'}</p>
                <p><strong>Sexe :</strong> ${donneesDemande.sexeEnfant || 'N/A'}</p>
                <p><strong>Né(e) le :</strong> ${donneesDemande.dateNaissanceEnfant ? new Date(donneesDemande.dateNaissanceEnfant).toLocaleDateString("fr-FR") : 'N/A'}</p>
                <p><strong>Lieu de naissance :</strong> ${donneesDemande.lieuNaissanceEnfant || 'N/A'}, ${communeNaissanceEnfant?.nom || ''}, ${provinceNaissanceEnfant?.nom || ''}</p>
                <p><strong>Père :</strong> ${donneesDemande.prenomPere || 'N/A'} ${donneesDemande.nomPere || 'N/A'}</p>
                <p><strong>Mère :</strong> ${donneesDemande.prenomMere || 'N/A'} ${donneesDemande.nomMere || 'N/A'}</p>
                <p>Délivré à Kinshasa, le ${currentDate}.</p>
              </div>
              ${signatureBlockSigned}
              <div class="footer-line"></div>
            </body>
          `;
          break;
        case 'acte_mariage':
          htmlContent = `
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              h1 { color: #003da5; text-align: center; }
              .header-with-image {
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                padding-bottom: 10px;
              }
              .header-image {
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
                width: 80px;
              }
              .header-text {
                flex-grow: 1;
                text-align: center;
                font-size: 12px;
                line-height: 1.2;
              }
              .header-line {
                position: absolute;
                bottom: -5px;
                left: 0;
                width: 100%;
                border-bottom: 1px solid #ccc;
              }
              .content {
                font-size: 13px;
                text-align: justify;
                margin-bottom: 10px;
                margin-top: 10px;
                line-height: 1.4;
              }
              .bourgmestre-name {
                font-family: 'Brush Script MT', 'Lucida Handwriting', cursive;
                font-size: 1.4em;
                margin-top: 5px;
                font-weight: bold;
                color: #000;
              }
              .footer-line {
                height: 3px;
                width: 100%;
                background: linear-gradient(to right, #0095c9 0%, #0095c9 33.33%, #fff24b 33.33%, #fff24b 66.66%, #db3832 66.66%, #db3832 100%);
                margin-top: 15px;
              }
            </style>
            <body>
              <div class="header-with-image">
                <img src="${logoBase64}" alt="Logo" class="header-image">
                <div class="header-text">
                  <h3>RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</h3>
                  <p>PROVINCE DE KINSHASA</p>
                  <p>COMMUNE DE ${citoyen.commune?.nom?.toUpperCase() || 'XXX'}</p>
                </div>
                <div class="header-line"></div>
              </div>
              <h1>ACTE DE MARIAGE</h1>
              <div class="content">
                <p>Le mariage entre :</p>
                <p>
                  <strong>Époux :</strong> ${citoyen.nom || 'N/A'} ${citoyen.postnom ? (citoyen.postnom + ' ') : ''}${citoyen.prenom || 'N/A'}
                </p>
                <p>
                  <strong>Épouse :</strong> ${donneesDemande.nomConjoint || 'N/A'} ${donneesDemande.postnomConjoint ? (donneesDemande.postnomConjoint + ' ') : ''}${donneesDemande.prenomConjoint || 'N/A'}
                </p>
                <p>a été célébré le ${donneesDemande.dateMariage ? new Date(donneesDemande.dateMariage).toLocaleDateString("fr-FR") : 'N/A'} dans notre commune.</p>
                <p>Délivré à Kinshasa, le ${currentDate}.</p>
              </div>
              ${signatureBlockSigned}
              <div class="footer-line"></div>
            </body>
          `;
          break;
        case 'acte_residence':
          htmlContent = `
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              h1 { color: #003da5; text-align: center; }
              .header-with-image {
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                padding-bottom: 10px;
              }
              .header-image {
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
                width: 80px;
              }
              .header-text {
                flex-grow: 1;
                text-align: center;
                font-size: 12px;
                line-height: 1.2;
              }
              .header-line {
                position: absolute;
                bottom: -5px;
                left: 0;
                width: 100%;
                border-bottom: 1px solid #ccc;
              }
              .content {
                font-size: 13px;
                text-align: justify;
                margin-top: 10px;
                margin-bottom: 10px;
                line-height: 1.4;
              }
              .bourgmestre-name {
                font-family: 'Brush Script MT', 'Lucida Handwriting', cursive;
                font-size: 1.4em;
                margin-top: 5px;
                font-weight: bold;
                color: #000;
              }
              .footer-line {
                height: 3px;
                width: 100%;
                background: linear-gradient(to right, #0095c9 0%, #0095c9 33.33%, #fff24b 33.33%, #fff24b 66.66%, #db3832 66.66%, #db3832 100%);
                margin-top: 15px;
              }
            </style>
            <body>
              <div class="header-with-image">
                <img src="${logoBase64}" alt="Logo" class="header-image">
                <div class="header-text">
                  <h3>RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</h3>
                  <p>PROVINCE DE KINSHASA</p>
                  <p>COMMUNE DE ${citoyen.commune?.nom?.toUpperCase() || 'XXX'}</p>
                </div>
                <div class="header-line"></div>
              </div>
              <h1>CERTIFICAT DE RÉSIDENCE</h1>
              <div class="content">
                <p>Je soussigné, le Bourgmestre de la commune de ${citoyen.commune?.nom || 'XXX'},</p>
                <p>atteste que le citoyen :</p>
                <p><strong>Nom :</strong> ${citoyen.nom || 'N/A'}</p>
                <p><strong>Postnom :</strong> ${citoyen.postnom || 'N/A'}</p>
                <p><strong>Prénom :</strong> ${citoyen.prenom || 'N/A'}</p>
                <p><strong>Réside à :</strong> ${donneesDemande.adresseComplete || 'N/A'}, ${citoyen.commune?.nom || 'XXX'}, Kinshasa.</p>
                <p>Délivré à Kinshasa, le ${currentDate}.</p>
              </div>
              ${signatureBlockSigned}
              <div class="footer-line"></div>
            </body>
          `;
          break;
        case 'carte_identite':
          htmlContent = `
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                background: #f0f0f0;
              }
              .id-card {
                width: 336px;
                height: 204px;
                border: 1px solid #003da5;
                border-radius: 10px;
                background: #fff;
                box-shadow: 2px 2px 6px rgba(0,0,0,0.2);
                display: flex;
                flex-direction: column;
                padding: 6px;
                box-sizing: border-box;
                position: relative;
              }
              .header-with-image {
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                margin-bottom: 4px;
              }
              .header-image {
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
                width: 28px;
              }
              .header-text {
                font-size: 8px;
                line-height: 1.2;
                text-align: center;
                flex-grow: 1;
              }
              .header-text h3 {
                margin: 0;
                font-size: 9px;
                color: #003da5;
              }
              .card-body {
                display: flex;
                flex: 1;
              }
              .card-left {
                flex: 1;
                text-align: center;
              }
              .card-right {
                flex: 2;
                font-size: 9px;
                line-height: 1.2;
                padding-left: 6px;
              }
              .profile-pic {
                width: 70px;
                height: 70px;
                border-radius: 5px;
                object-fit: cover;
                border: 1px solid #003da5;
                margin-bottom: 6px;
              }
              .qr-code img {
                width: 55px;
                height: 55px;
                margin-top: 4px;
              }
              .card-info p {
                margin: 1px 0;
              }
              .signature {
                font-size: 8px;
                text-align: right;
                margin-top: 4px;
                font-family: 'Brush Script MT', 'Lucida Handwriting', cursive;
              }
              .footer-line {
                position: absolute;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 3px;
                background: linear-gradient(to right, #0095c9 0%, #0095c9 33.33%, #fff24b 33.33%, #fff24b 66.66%, #db3832 66.66%, #db3832 100%);
                border-bottom-left-radius: 10px;
                border-bottom-right-radius: 10px;
                margin: 0;
              }
            </style>
            <body>
              <div class="id-card">
                <div class="header-with-image">
                  <img src="${logoBase64}" alt="Logo" class="header-image">
                  <div class="header-text">
                    <h3>RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</h3>
                    <p>COMMUNE DE ${citoyen.commune?.nom?.toUpperCase() || 'XXX'}</p>
                  </div>
                </div>
                <div class="card-body">
                  <div class="card-left">
                    <img src="${photoUrl || 'https://placehold.co/70x70/003DA5/FFFFFF?text=PHOTO'}" alt="Photo de profil" class="profile-pic">
                    <div class="qr-code">
                      <img src="${qrCodeDataURL}" alt="QR Code">
                    </div>
                  </div>
                  <div class="card-right">
                    <div class="card-info">
                      <p><strong>Nom :</strong> ${citoyen.nom || 'N/A'}</p>
                      <p><strong>Postnom :</strong> ${citoyen.postnom || 'N/A'}</p>
                      <p><strong>Prénom :</strong> ${citoyen.prenom || 'N/A'}</p>
                      <p><strong>Né(e) le :</strong> ${citoyen.dateNaissance ? new Date(citoyen.dateNaissance).toLocaleDateString("fr-FR") : 'N/A'}</p>
                      <p><strong>Sexe :</strong> ${citoyen.sexe || 'N/A'}</p>
                      <p><strong>Lieu :</strong> ${citoyen.lieuNaissance || 'N/A'}</p>
                      <p><strong>N° Unique :</strong> ${citoyen.numeroUnique || 'N/A'}</p>
                      <p><strong>Délivrée le :</strong> ${currentDate}</p>
                    </div>
                    <div class="signature">
                      <p>Le Bourgmestre</p>
                    </div>
                  </div>
                </div>
                <div class="footer-line"></div>
              </div>
            </body>
          `;
          break;
        default:
          htmlContent = `
            <body>
              <h1>Document Non Standard</h1>
              <p>Type de document non reconnu ou template non disponible.</p>
              <p>ID Demande: ${demande.id}</p>
              <p>Type: ${demande.typeDemande}</p>
              <p>Délivré à Kinshasa, le ${currentDate}.</p>
              ${signatureBlockSigned}
            </body>
          `;
      }
      const browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
        timeout: 120000,
      });
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0', timeout: 120000 });
      const filename = `${typeDemande}_${demande.id}_${verificationToken}.pdf`;
      const pdfPath = path.join(DOCUMENTS_DIR, filename);
      await fs.mkdir(DOCUMENTS_DIR, { recursive: true }).catch(err => {
        console.error("Erreur lors de la création du dossier 'documents':", err);
      });
      await page.pdf({ path: pdfPath, format: 'A4', printBackground: true, timeout: 120000 });
      await browser.close();
      await demande.update({
        documentPath: filename
      });
      res.json({
        message: "Document signé et validé.",
        documentUrl: `${filename}`,
        verificationUrl: verificationUrl
      });
    } catch (error) {
      console.error("Erreur validateDocument:", error);
      return res.status(500).json({ message: "Erreur lors de la validation/signature du document", error: error.message });
    }
  }
};