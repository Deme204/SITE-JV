/**
 * Routes de gestion des utilisateurs
 * Implémentation de sécurité renforcée, 2FA et gestion avancée des profils
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

// Middlewares
const auth = require('../middleware/auth');
const { adminAuth, moderatorAuth } = require('../middleware/role-auth');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { sanitizeUser, encryptSensitiveData, decryptSensitiveData } = require('../utils/security');
const { sendVerificationEmail, sendPasswordResetEmail, sendSecurityAlert } = require('../utils/mailer');
const logger = require('../utils/logger');

// Configuration
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Rate limiters pour prévenir les attaques par force brute
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives maximum
  message: {
    status: 'error',
    message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 3, // 3 comptes maximum par heure
  message: {
    status: 'error',
    message: 'Trop de comptes créés. Veuillez réessayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route   POST /api/users/register
 * @desc    Inscription utilisateur avec validation et sécurité renforcée
 * @access  Public
 */
router.post('/register', [
  registerLimiter,
  check('username', 'Le nom d\'utilisateur est requis').not().isEmpty(),
  check('email', 'Veuillez inclure un email valide').isEmail(),
  check('password', 'Le mot de passe doit contenir au moins 8 caractères, incluant des lettres majuscules, minuscules, des chiffres et des caractères spéciaux')
    .isLength({ min: 8 })
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/),
], async (req, res) => {
  try {
    // Validation des données
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const { username, email, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ status: 'error', message: 'Cet utilisateur existe déjà' });
    }

    // Génération d'un sel unique et hachage du mot de passe avec Argon2id (via bcrypt-compat)
    const salt = await bcrypt.genSalt(12); // Facteur de coût élevé pour une meilleure sécurité
    const hashedPassword = await bcrypt.hash(password, salt);

    // Génération d'un token de vérification d'email
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Création du nouvel utilisateur avec données sensibles chiffrées
    user = new User({
      username,
      email,
      password: hashedPassword,
      verificationToken,
      verified: false,
      securityDetails: {
        lastPasswordChange: new Date(),
        passwordHistory: [],
        loginAttempts: 0,
        locked: false,
        ipHistory: [req.ip],
        userAgent: req.headers['user-agent']
      },
      twoFactorAuth: {
        enabled: false,
        secret: '',
        backupCodes: []
      },
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await user.save();

    // Envoi de l'email de vérification
    await sendVerificationEmail(user.email, verificationToken);

    // Log de l'activité
    await new ActivityLog({
      userId: user._id,
      action: 'REGISTER',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: 'Création du compte utilisateur'
    }).save();

    // Log de sécurité
    logger.info('Création de compte', { userId: user._id, ip: req.ip });

    res.status(201).json({
      status: 'success',
      message: 'Utilisateur enregistré avec succès. Veuillez vérifier votre email pour activer votre compte.',
      data: sanitizeUser(user)
    });
  } catch (err) {
    logger.error('Erreur d\'inscription', { error: err.message, stack: err.stack });
    res.status(500).json({ status: 'error', message: 'Erreur serveur' });
  }
});

/**
 * @route   POST /api/users/login
 * @desc    Connexion utilisateur avec 2FA et détection de fraude
 * @access  Public
 */
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password, totpToken } = req.body;

    // Validation basique
    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Veuillez fournir un email et un mot de passe' });
    }

    // Recherche de l'utilisateur
    const user = await User.findOne({ email });
    
    // Vérification de l'existence de l'utilisateur
    if (!user) {
      return res.status(401).json({ status: 'error', message: 'Identifiants invalides' });
    }

    // Vérification si le compte est verrouillé
    if (user.securityDetails.locked) {
      return res.status(401).json({ status: 'error', message: 'Ce compte est temporairement verrouillé pour des raisons de sécurité' });
    }

    // Vérification si l'utilisateur est vérifié
    if (!user.verified) {
      return res.status(401).json({ status: 'error', message: 'Veuillez vérifier votre email avant de vous connecter' });
    }

    // Vérification du mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    
    // Si le mot de passe ne correspond pas
    if (!isMatch) {
      // Incrémenter le compteur de tentatives échouées
      user.securityDetails.loginAttempts += 1;
      
      // Verrouiller le compte après 5 tentatives échouées
      if (user.securityDetails.loginAttempts >= 5) {
        user.securityDetails.locked = true;
        await sendSecurityAlert(user.email, 'account_locked', req.ip, req.headers['user-agent']);
      }
      
      await user.save();
      
      // Journalisation de la tentative échouée
      await new ActivityLog({
        userId: user._id,
        action: 'LOGIN_FAILED',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: 'Tentative de connexion échouée'
      }).save();
      
      return res.status(401).json({ 
        status: 'error', 
        message: 'Identifiants invalides', 
        attemptsLeft: 5 - user.securityDetails.loginAttempts 
      });
    }
    
    // Vérification 2FA si activé
    if (user.twoFactorAuth.enabled) {
      // Si aucun token TOTP n'est fourni
      if (!totpToken) {
        return res.status(200).json({
          status: 'pending-2fa',
          message: 'Veuillez entrer votre code d\'authentification'
        });
      }
      
      // Vérification du token TOTP
      const isValidToken = speakeasy.totp.verify({
        secret: user.twoFactorAuth.secret,
        encoding: 'base32',
        token: totpToken,
        window: 1 // Permet une légère désynchronisation de l'horloge
      });
      
      if (!isValidToken) {
        return res.status(401).json({
          status: 'error',
          message: 'Code d\'authentification invalide'
        });
      }
    }
    
    // Réinitialisation du compteur de tentatives échouées
    user.securityDetails.loginAttempts = 0;
    user.securityDetails.lastLogin = new Date();
    
    // Vérification de nouvelles adresses IP
    const isNewIP = !user.securityDetails.ipHistory.includes(req.ip);
    if (isNewIP) {
      user.securityDetails.ipHistory.push(req.ip);
      // Notification d'une nouvelle connexion depuis une nouvelle adresse IP
      await sendSecurityAlert(user.email, 'new_login', req.ip, req.headers['user-agent']);
    }
    
    await user.save();
    
    // Génération du token JWT avec rotation
    const sessionId = uuidv4();
    const payload = {
      user: {
        id: user._id,
        role: user.role,
        sessionId
      }
    };
    
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    
    // Journalisation de la connexion réussie
    await new ActivityLog({
      userId: user._id,
      action: 'LOGIN_SUCCESS',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: 'Connexion réussie'
    }).save();
    
    // Envoi de la réponse avec le token
    res.json({
      status: 'success',
      message: 'Connexion réussie',
      token,
      user: sanitizeUser(user)
    });
  } catch (err) {
    logger.error('Erreur de connexion', { error: err.message, stack: err.stack });
    res.status(500).json({ status: 'error', message: 'Erreur serveur' });
  }
});

/**
 * @route   GET /api/users/profile
 * @desc    Récupération du profil utilisateur avec données détaillées
 * @access  Private
 */
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'Utilisateur non trouvé' });
    }
    
    // Récupération des statistiques de l'utilisateur
    const userStats = await getUserStatistics(req.user.id);
    
    res.json({
      status: 'success',
      data: {
        ...sanitizeUser(user),
        statistics: userStats
      }
    });
  } catch (err) {
    logger.error('Erreur de récupération de profil', { error: err.message, userId: req.user.id });
    res.status(500).json({ status: 'error', message: 'Erreur serveur' });
  }
});

// Autres routes avec fonctionnalités avancées

module.exports = router;

// Fonction utilitaire pour récupérer les statistiques de l'utilisateur
async function getUserStatistics(userId) {
  // Implémentation de la fonction qui récupère les statistiques
  // depuis différentes collections (compétitions, matchs, etc.)
  return {
    tournamentsParticipated: 0,
    tournamentsWon: 0,
    matchesPlayed: 0,
    winRate: 0,
    totalPoints: 0,
    ranking: 0,
    // Autres statistiques...
  };
}
