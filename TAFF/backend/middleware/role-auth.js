/**
 * Middleware de contrôle d'accès basé sur les rôles
 * Fournit des middlewares pour restreindre l'accès aux routes en fonction du rôle de l'utilisateur
 */

const logger = require('../utils/logger');

/**
 * Middleware pour restreindre l'accès aux administrateurs uniquement
 * Nécessite que le middleware auth.js soit exécuté en premier
 */
exports.adminAuth = (req, res, next) => {
  // Vérifier si l'utilisateur est authentifié et si son rôle est présent
  if (!req.user || !req.userRole) {
    return res.status(401).json({
      status: 'error',
      message: 'Non authentifié. Veuillez vous connecter.'
    });
  }

  // Vérifier si l'utilisateur a le rôle d'administrateur
  if (req.userRole !== 'admin') {
    logger.warn('Tentative d\'accès non autorisé à une route d\'administration', {
      userId: req.user.id,
      userRole: req.userRole,
      path: req.originalUrl
    });
    
    return res.status(403).json({
      status: 'error',
      message: 'Accès refusé. Droits d\'administrateur requis.'
    });
  }

  // Si l'utilisateur est un administrateur, continuer
  next();
};

/**
 * Middleware pour restreindre l'accès aux modérateurs et administrateurs
 * Nécessite que le middleware auth.js soit exécuté en premier
 */
exports.moderatorAuth = (req, res, next) => {
  // Vérifier si l'utilisateur est authentifié et si son rôle est présent
  if (!req.user || !req.userRole) {
    return res.status(401).json({
      status: 'error',
      message: 'Non authentifié. Veuillez vous connecter.'
    });
  }

  // Vérifier si l'utilisateur a le rôle de modérateur ou d'administrateur
  if (req.userRole !== 'moderator' && req.userRole !== 'admin') {
    logger.warn('Tentative d\'accès non autorisé à une route de modération', {
      userId: req.user.id,
      userRole: req.userRole,
      path: req.originalUrl
    });
    
    return res.status(403).json({
      status: 'error',
      message: 'Accès refusé. Droits de modérateur ou administrateur requis.'
    });
  }

  // Si l'utilisateur est un modérateur ou un administrateur, continuer
  next();
};

/**
 * Middleware pour vérifier l'accès à un rôle spécifique ou un ensemble de rôles
 * @param {string|string[]} roles - Le rôle ou tableau de rôles autorisés
 * @returns {function} Middleware Express
 */
exports.roleAuth = (roles) => {
  return (req, res, next) => {
    // Vérifier si l'utilisateur est authentifié et si son rôle est présent
    if (!req.user || !req.userRole) {
      return res.status(401).json({
        status: 'error',
        message: 'Non authentifié. Veuillez vous connecter.'
      });
    }
    
    // Convertir en tableau si un seul rôle est passé
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    // Vérifier si le rôle de l'utilisateur est dans la liste des rôles autorisés
    if (!allowedRoles.includes(req.userRole)) {
      logger.warn('Tentative d\'accès non autorisé à une route protégée', {
        userId: req.user.id,
        userRole: req.userRole,
        requiredRoles: allowedRoles,
        path: req.originalUrl
      });
      
      return res.status(403).json({
        status: 'error',
        message: 'Accès refusé. Vous n\'avez pas les permissions nécessaires.'
      });
    }
    
    // Si l'utilisateur a un rôle autorisé, continuer
    next();
  };
};
