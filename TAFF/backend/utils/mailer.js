/**
 * Module d'envoi d'emails
 * Gère toutes les communications par email, y compris la vérification des comptes,
 * les alertes de sécurité et les notifications de tournois
 */

const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;
const Handlebars = require('handlebars');
const logger = require('./logger');

// Chargement des variables d'environnement
require('dotenv').config();

// Configuration de nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_PORT === '465', // true pour le port 465, false pour les autres ports
  auth: {
    user: process.env.EMAIL_USERNAME || 'noreply@example.com',
    pass: process.env.EMAIL_PASSWORD || 'your-email-password'
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === 'production' // Nécessaire en dev si certificat auto-signé
  }
});

// Répertoire contenant les modèles d'email
const templatesDir = path.join(__dirname, '../templates/emails');

/**
 * Charge et compile un modèle d'email
 * @param {string} templateName - Nom du fichier de modèle (sans extension)
 * @returns {Promise<Function>} Fonction de modèle compilée
 */
async function loadTemplate(templateName) {
  try {
    const filePath = path.join(templatesDir, `${templateName}.html`);
    const source = await fs.readFile(filePath, 'utf-8');
    return Handlebars.compile(source);
  } catch (err) {
    logger.error('Erreur lors du chargement du modèle d\'email', { error: err.message, template: templateName });
    // En cas d'erreur, retourner un modèle par défaut
    return Handlebars.compile('<h1>{{title}}</h1><p>{{content}}</p>');
  }
}

/**
 * Fonction générique d'envoi d'email
 * @param {Object} options - Options d'email
 * @returns {Promise<Object>} Résultat de l'envoi
 */
async function sendEmail(options) {
  try {
    // Configuration de base de l'email
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'E-Sport Competition'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USERNAME}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text // Version texte simple pour les clients qui ne supportent pas le HTML
    };
    
    // Ajouter des pièces jointes si présentes
    if (options.attachments) {
      mailOptions.attachments = options.attachments;
    }
    
    // Envoi de l'email
    const info = await transporter.sendMail(mailOptions);
    
    logger.info('Email envoyé avec succès', {
      messageId: info.messageId,
      to: options.to,
      subject: options.subject
    });
    
    return { success: true, messageId: info.messageId };
  } catch (err) {
    logger.error('Erreur lors de l\'envoi d\'email', {
      error: err.message,
      to: options.to,
      subject: options.subject
    });
    
    return { success: false, error: err.message };
  }
}

/**
 * Envoie un email de vérification de compte
 * @param {string} email - Email du destinataire
 * @param {string} token - Token de vérification
 * @returns {Promise<Object>} Résultat de l'envoi
 */
exports.sendVerificationEmail = async (email, token) => {
  try {
    // Charger le modèle d'email
    const template = await loadTemplate('verification');
    
    // URL de vérification
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/verify-email?token=${token}`;
    
    // Compiler le modèle avec les données
    const html = template({
      username: email.split('@')[0], // Utiliser la partie locale de l'email comme nom d'utilisateur par défaut
      verificationUrl,
      companyName: 'E-Sport Competition',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@esport-competition.com',
      year: new Date().getFullYear()
    });
    
    // Créer une version texte simple
    const text = `Bienvenue sur E-Sport Competition ! Veuillez vérifier votre adresse email en cliquant sur le lien suivant : ${verificationUrl}`;
    
    // Envoyer l'email
    return await sendEmail({
      to: email,
      subject: 'Vérifiez votre adresse email - E-Sport Competition',
      html,
      text
    });
  } catch (err) {
    logger.error('Erreur lors de l\'envoi de l\'email de vérification', {
      error: err.message,
      email
    });
    
    return { success: false, error: err.message };
  }
};

/**
 * Envoie un email de réinitialisation de mot de passe
 * @param {string} email - Email du destinataire
 * @param {string} token - Token de réinitialisation
 * @returns {Promise<Object>} Résultat de l'envoi
 */
exports.sendPasswordResetEmail = async (email, token) => {
  try {
    // Charger le modèle d'email
    const template = await loadTemplate('password-reset');
    
    // URL de réinitialisation
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${token}`;
    
    // Compiler le modèle avec les données
    const html = template({
      resetUrl,
      expiryHours: 1, // Validité du token en heures
      companyName: 'E-Sport Competition',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@esport-competition.com',
      year: new Date().getFullYear()
    });
    
    // Créer une version texte simple
    const text = `Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien suivant pour définir un nouveau mot de passe : ${resetUrl}. Ce lien est valide pendant 1 heure.`;
    
    // Envoyer l'email
    return await sendEmail({
      to: email,
      subject: 'Réinitialisation de votre mot de passe - E-Sport Competition',
      html,
      text
    });
  } catch (err) {
    logger.error('Erreur lors de l\'envoi de l\'email de réinitialisation', {
      error: err.message,
      email
    });
    
    return { success: false, error: err.message };
  }
};

/**
 * Envoie une alerte de sécurité (nouvelle connexion, verrouillage de compte, etc.)
 * @param {string} email - Email du destinataire
 * @param {string} alertType - Type d'alerte ('new_login', 'account_locked', etc.)
 * @param {string} ip - Adresse IP concernée
 * @param {string} userAgent - User-Agent du navigateur
 * @returns {Promise<Object>} Résultat de l'envoi
 */
exports.sendSecurityAlert = async (email, alertType, ip, userAgent) => {
  try {
    // Charger le modèle d'email approprié
    const template = await loadTemplate('security-alert');
    
    // Configurer le contenu en fonction du type d'alerte
    let subject, alertTitle, alertMessage, actionRequired;
    const now = new Date().toLocaleString('fr-FR');
    
    switch (alertType) {
      case 'new_login':
        subject = 'Nouvelle connexion détectée - E-Sport Competition';
        alertTitle = 'Nouvelle connexion à votre compte';
        alertMessage = `Une nouvelle connexion à votre compte a été détectée le ${now} depuis l'adresse IP ${ip} avec le navigateur ${userAgent}.`;
        actionRequired = 'Si vous ne reconnaissez pas cette activité, veuillez sécuriser votre compte immédiatement en modifiant votre mot de passe.';
        break;
        
      case 'account_locked':
        subject = 'Compte verrouillé - E-Sport Competition';
        alertTitle = 'Votre compte a été temporairement verrouillé';
        alertMessage = `Après plusieurs tentatives de connexion échouées, votre compte a été temporairement verrouillé le ${now}. Dernière tentative depuis l'adresse IP ${ip}.`;
        actionRequired = 'Pour débloquer votre compte, veuillez utiliser la fonctionnalité de réinitialisation de mot de passe ou contacter notre service client.';
        break;
        
      case 'password_changed':
        subject = 'Mot de passe modifié - E-Sport Competition';
        alertTitle = 'Votre mot de passe a été modifié';
        alertMessage = `Le mot de passe de votre compte a été modifié le ${now} depuis l'adresse IP ${ip}.`;
        actionRequired = 'Si vous n\'avez pas effectué ce changement, veuillez contacter immédiatement notre service client et sécuriser vos autres comptes.';
        break;
        
      default:
        subject = 'Alerte de sécurité - E-Sport Competition';
        alertTitle = 'Activité inhabituelle détectée';
        alertMessage = `Une activité inhabituelle a été détectée sur votre compte le ${now} depuis l'adresse IP ${ip}.`;
        actionRequired = 'Si vous ne reconnaissez pas cette activité, veuillez contacter notre service client.';
    }
    
    // URL de sécurité du compte
    const securityUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/account/security`;
    
    // Compiler le modèle avec les données
    const html = template({
      alertTitle,
      alertMessage,
      actionRequired,
      securityUrl,
      ip,
      userAgent,
      date: now,
      companyName: 'E-Sport Competition',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@esport-competition.com',
      year: new Date().getFullYear()
    });
    
    // Créer une version texte simple
    const text = `${alertTitle}\n\n${alertMessage}\n\n${actionRequired}\n\nPour gérer la sécurité de votre compte, visitez : ${securityUrl}`;
    
    // Envoyer l'email avec haute priorité
    return await sendEmail({
      to: email,
      subject,
      html,
      text,
      priority: 'high'
    });
  } catch (err) {
    logger.error('Erreur lors de l\'envoi de l\'alerte de sécurité', {
      error: err.message,
      email,
      alertType
    });
    
    return { success: false, error: err.message };
  }
};

/**
 * Envoie une confirmation d'inscription à un tournoi
 * @param {string} email - Email du destinataire
 * @param {Object} tournament - Informations sur le tournoi
 * @param {Object} registrationDetails - Détails de l'inscription
 * @returns {Promise<Object>} Résultat de l'envoi
 */
exports.sendTournamentRegistration = async (email, tournament, registrationDetails) => {
  try {
    // Charger le modèle d'email
    const template = await loadTemplate('tournament-registration');
    
    // URL des détails du tournoi
    const tournamentUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/tournaments/${tournament.id}`;
    
    // QR Code pour l'entrée (pourrait être généré via une API ou une bibliothèque)
    const qrCodeAttachment = {
      filename: 'qrcode.png',
      path: registrationDetails.qrCodePath || 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=' + encodeURIComponent(registrationDetails.confirmationCode),
      cid: 'qrcode' // ID utilisé dans le modèle pour faire référence à l'image
    };
    
    // Compiler le modèle avec les données
    const html = template({
      username: registrationDetails.username,
      tournamentName: tournament.name,
      tournamentDate: new Date(tournament.date).toLocaleDateString('fr-FR'),
      tournamentTime: new Date(tournament.date).toLocaleTimeString('fr-FR'),
      tournamentLocation: tournament.location || 'En ligne',
      confirmationCode: registrationDetails.confirmationCode,
      tournamentUrl,
      companyName: 'E-Sport Competition',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@esport-competition.com',
      year: new Date().getFullYear()
    });
    
    // Créer une version texte simple
    const text = `Confirmation d'inscription au tournoi ${tournament.name}\n\nDate: ${new Date(tournament.date).toLocaleDateString('fr-FR')}\nHeure: ${new Date(tournament.date).toLocaleTimeString('fr-FR')}\nLieu: ${tournament.location || 'En ligne'}\n\nCode de confirmation: ${registrationDetails.confirmationCode}\n\nPour plus de détails, visitez: ${tournamentUrl}`;
    
    // Envoyer l'email avec la pièce jointe
    return await sendEmail({
      to: email,
      subject: `Confirmation d'inscription - ${tournament.name}`,
      html,
      text,
      attachments: [qrCodeAttachment]
    });
  } catch (err) {
    logger.error('Erreur lors de l\'envoi de l\'email de confirmation de tournoi', {
      error: err.message,
      email,
      tournamentId: tournament.id
    });
    
    return { success: false, error: err.message };
  }
};

/**
 * Vérifie la configuration du transport d'emails
 * @returns {Promise<boolean>} Vrai si la configuration est valide
 */
exports.verifyEmailConfiguration = async () => {
  try {
    await transporter.verify();
    logger.info('Configuration email vérifiée avec succès');
    return true;
  } catch (err) {
    logger.error('Erreur de configuration email', { error: err.message });
    return false;
  }
};
