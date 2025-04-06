/**
 * Middleware d'authentification
 * Vérifie et valide les tokens JWT pour protéger les routes
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

// Chargement des variables d'environnement
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

/**
 * Middleware d'authentification par token JWT
 * Ce middleware vérifie l'en-tête Authorization et extrait le token JWT
 * Il valide ensuite le token et ajoute l'identifiant d'utilisateur à l'objet req
 */
module.exports = async function (req, res, next) {
  // Récupération du token depuis l'en-tête
  const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');

  // Vérification de la présence du token
  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Accès refusé. Aucun token fourni.'
    });
  }

  try {
    // Vérification et décodage du token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Ajouter l'ID utilisateur à la requête
    req.user = decoded.user;
    
    // Vérifier si le compte utilisateur existe toujours et n'est pas verrouillé
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Token invalide. Utilisateur non trouvé.'
      });
    }
    
    // Vérifier si le compte est verrouillé
    if (user.securityDetails && user.securityDetails.locked) {
      return res.status(403).json({
        status: 'error',
        message: 'Compte verrouillé pour des raisons de sécurité. Veuillez contacter le support.'
      });
    }
    
    // Vérifier si le compte est vérifié
    if (!user.verified) {
      return res.status(403).json({
        status: 'error',
        message: 'Compte non vérifié. Veuillez vérifier votre adresse email.'
      });
    }
    
    // Vérification de session invalidée (déconnexion forcée)
    if (user.invalidatedSessions && user.invalidatedSessions.includes(req.user.sessionId)) {
      return res.status(401).json({
        status: 'error',
        message: 'Session expirée. Veuillez vous reconnecter.'
      });
    }
    
    // Stocker des informations utiles
    req.userRole = user.role;
    
    // Passer à la suite
    next();
  } catch (err) {
    logger.error('Erreur d\'authentification', { error: err.message });
    
    // Gérer les différents types d'erreurs JWT
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token expiré. Veuillez vous reconnecter.'
      });
    }
    
    return res.status(401).json({
      status: 'error',
      message: 'Token invalide.'
    });
  }
};
