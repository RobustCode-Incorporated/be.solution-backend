// utils/mailer.js
const SibApiV3Sdk = require('@getbrevo/brevo');
require('dotenv').config();

const brevo = new SibApiV3Sdk.TransactionalEmailsApi();
brevo.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY;

// Fonction pour envoyer un email de confirmation d’inscription
exports.sendNUCEmail = async (email, nomComplet, numeroUnique) => {
  try {
    const sendSmtpEmail = {
      sender: { name: 'e-Services RDC', email: 'contact@robust-code.com' },
      to: [{ email, name: nomComplet }],
      subject: 'Votre Numéro Unique du Citoyen (NUC)',
      htmlContent: `
        <h2>Bienvenue sur e-Services RDC 🇨🇩</h2>
        <p>Bonjour <strong>${nomComplet}</strong>,</p>
        <p>Votre inscription a été effectuée avec succès.</p>
        <p>Voici votre <strong>Numéro Unique du Citoyen (NUC)</strong> :</p>
        <h3 style="color:#0E2C5A;">${numeroUnique}</h3>
        <p>Ce numéro vous servira à vous connecter à l’application mobile et à accéder à vos services administratifs numériques.</p>
        <br/>
        <p style="color:#707070;">L’équipe e-Services RDC</p>
      `
    };

    await brevo.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ E-mail envoyé à ${email}`);
  } catch (error) {
    console.error('Erreur lors de l’envoi de l’e-mail NUC :', error.message);
  }
};