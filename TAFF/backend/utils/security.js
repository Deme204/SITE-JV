/**
 * Utilitaires de sécurité
 * Fonctions pour la gestion sécurisée des données utilisateurs, chiffrement et validation
 */

const crypto = require('crypto');
const logger = require('./logger');

// Chargement des variables d'environnement
require('dotenv').config();
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
const IV_LENGTH = 16; // Pour AES, c'est toujours 16 bytes

/**
 * Nettoie un objet utilisateur pour le retour client en supprimant les données sensibles
 * @param {Object} user - Objet utilisateur
 * @returns {Object} Utilisateur sans données sensibles
 */
exports.sanitizeUser = (user) => {
  if (!user) return null;
  
  // Conversion en objet simple si c'est un document Mongoose
  const userObj = user.toObject ? user.toObject() : { ...user };
  
  // Suppression des champs sensibles
  delete userObj.password;
  delete userObj.verificationToken;
  delete userObj.resetPasswordToken;
  delete userObj.twoFactorAuth.secret;
  delete userObj.twoFactorAuth.backupCodes;
  
  // Masquer partiellement l'email pour la sécurité
  if (userObj.email) {
    const [username, domain] = userObj.email.split('@');
    userObj.email = `${username.substring(0, 3)}***@${domain}`;
  }
  
  return userObj;
};

/**
 * Chiffre des données sensibles (AES-256-CBC)
 * @param {string} text - Texte à chiffrer
 * @returns {string} Texte chiffré encodé en base64
 */
exports.encryptSensitiveData = (text) => {
  if (!text) return '';
  
  try {
    // Générer un IV aléatoire
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Créer l'algorithme de chiffrement
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    
    // Chiffrer le texte
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Retourner IV + données chiffrées (au format base64)
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (err) {
    logger.error('Erreur de chiffrement', { error: err.message });
    throw new Error('Erreur lors du chiffrement des données sensibles');
  }
};

/**
 * Déchiffre des données sensibles (AES-256-CBC)
 * @param {string} encryptedText - Texte chiffré encodé en base64 (IV:Data)
 * @returns {string} Texte déchiffré
 */
exports.decryptSensitiveData = (encryptedText) => {
  if (!encryptedText) return '';
  
  try {
    // Extraire l'IV et les données chiffrées
    const [ivHex, encryptedHex] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    
    // Créer l'algorithme de déchiffrement
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    
    // Déchiffrer le texte
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (err) {
    logger.error('Erreur de déchiffrement', { error: err.message });
    throw new Error('Erreur lors du déchiffrement des données sensibles');
  }
};

/**
 * Génère un mot de passe aléatoire sécurisé
 * @param {number} length - Longueur du mot de passe (défaut: 12)
 * @returns {string} Mot de passe généré
 */
exports.generateSecurePassword = (length = 12) => {
  // Caractères possibles pour un mot de passe fort
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Sans I et O (ressemblent à 1 et 0)
  const lowercase = 'abcdefghijkmnopqrstuvwxyz'; // Sans l (ressemble à 1)
  const numbers = '23456789'; // Sans 0 et 1 (pour éviter les confusions)
  const symbols = '!@#$%^&*()_+{}[]|:;<>,.?/~';
  
  const allChars = uppercase + lowercase + numbers + symbols;
  
  // S'assurer que le mot de passe contient au moins un caractère de chaque type
  let password = '';
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += symbols.charAt(Math.floor(Math.random() * symbols.length));
  
  // Remplir le reste du mot de passe
  for (let i = 4; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  // Mélanger les caractères
  password = password.split('').sort(() => 0.5 - Math.random()).join('');
  
  return password;
};

/**
 * Vérifie la force d'un mot de passe
 * @param {string} password - Mot de passe à évaluer
 * @returns {Object} Résultat avec score et messages
 */
exports.checkPasswordStrength = (password) => {
  if (!password) {
    return {
      score: 0,
      message: 'Aucun mot de passe fourni',
      suggestions: ['Veuillez saisir un mot de passe']
    };
  }
  
  let score = 0;
  const suggestions = [];
  
  // Longueur minimale
  if (password.length < 8) {
    suggestions.push('Utilisez au moins 8 caractères');
  } else {
    score += Math.min(2, Math.floor(password.length / 4));
  }
  
  // Vérifier la diversité des caractères
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSymbols = /[^a-zA-Z0-9]/.test(password);
  
  // Ajouter des points pour chaque type de caractère
  if (hasLowercase) score++;
  if (hasUppercase) score++;
  if (hasNumbers) score++;
  if (hasSymbols) score += 2;
  
  // Ajouter des suggestions si certains types de caractères sont manquants
  if (!hasLowercase) suggestions.push('Ajoutez des lettres minuscules');
  if (!hasUppercase) suggestions.push('Ajoutez des lettres majuscules');
  if (!hasNumbers) suggestions.push('Ajoutez des chiffres');
  if (!hasSymbols) suggestions.push('Ajoutez des caractères spéciaux');
  
  // Pénalités pour les motifs répétitifs
  if (/(.)\1\1/.test(password)) {
    score--;
    suggestions.push('Évitez les caractères répétitifs');
  }
  
  // Pénalités pour les séquences
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
    score--;
    suggestions.push('Évitez les séquences de caractères courants');
  }
  
  // Limiter le score de 0 à 10
  score = Math.max(0, Math.min(10, score));
  
  // Message basé sur le score
  let message;
  if (score < 3) {
    message = 'Très faible';
  } else if (score < 5) {
    message = 'Faible';
  } else if (score < 7) {
    message = 'Moyen';
  } else if (score < 9) {
    message = 'Fort';
  } else {
    message = 'Très fort';
  }
  
  return {
    score,
    message,
    suggestions: suggestions.length > 0 ? suggestions : ['Mot de passe acceptable']
  };
};

/**
 * Fonction pour valider les données utilisateur potentiellement dangereuses
 * @param {string} input - Chaîne à valider
 * @param {Object} options - Options de validation
 * @returns {string} Chaîne nettoyée
 */
exports.sanitizeInput = (input, options = {}) => {
  if (typeof input !== 'string') return '';
  
  const defaultOptions = {
    allowHTML: false,
    maxLength: 255,
    trim: true
  };
  
  const opts = { ...defaultOptions, ...options };
  
  let result = input;
  
  // Trim
  if (opts.trim) {
    result = result.trim();
  }
  
  // Limite de longueur
  if (result.length > opts.maxLength) {
    result = result.substring(0, opts.maxLength);
  }
  
  // Retirer les balises HTML si non autorisées
  if (!opts.allowHTML) {
    result = result.replace(/<[^>]*>/g, '');
  }
  
  // Échapper les caractères spéciaux pour éviter les injections
  result = result
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  return result;
};

/**
 * Détecte les tentatives d'attaque en analysant l'entrée utilisateur
 * @param {string} input - Entrée à analyser
 * @returns {boolean} Vrai si une attaque potentielle est détectée
 */
exports.detectAttackAttempt = (input) => {
  if (typeof input !== 'string') return false;
  
  // Modèles d'attaque courants à détecter
  const attackPatterns = [
    // Injection SQL
    /'\s*OR\s*'1'\s*=\s*'1/i,
    /'\s*OR\s*1\s*=\s*1/i,
    /--/,
    /UNION\s+SELECT/i,
    /DROP\s+TABLE/i,
    
    // XSS
    /<script>/i,
    /javascript:/i,
    /onload=/i,
    /onerror=/i,
    /onclick=/i,
    
    // Command injection
    /;\s*rm\s+-rf/i,
    /;\s*del\s+/i,
    /\|\s*cat\s+/i,
    /\|\s*type\s+/i
  ];
  
  // Vérifier chaque modèle
  for (const pattern of attackPatterns) {
    if (pattern.test(input)) {
      logger.warn('Tentative d\'attaque détectée', { input: input.substring(0, 100) });
      return true;
    }
  }
  
  return false;
};
