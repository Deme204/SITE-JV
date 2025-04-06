/**
 * Module de journalisation avancé
 * Fournit des fonctionnalités de logging avec différents niveaux de gravité,
 * rotation des fichiers et alertes en temps réel pour les événements critiques
 */

const winston = require('winston');
const { createLogger, format, transports } = winston;
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Créer le dossier logs s'il n'existe pas
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Configuration des niveaux de log personnalisés
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
};

// Format personnalisé
const customFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json(),
  format.metadata({ fillExcept: ['message', 'level', 'timestamp'] })
);

// Transport pour la rotation des fichiers de log quotidiens
const dailyRotateTransport = new DailyRotateFile({
  filename: path.join(logDir, '%DATE%-app.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d'
});

// Transport spécifique pour les logs de sécurité
const securityRotateTransport = new DailyRotateFile({
  filename: path.join(logDir, '%DATE%-security.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  level: 'warn'
});

// Création du logger
const logger = createLogger({
  levels,
  format: customFormat,
  transports: [
    // Logs de console en développement
    new transports.Console({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: format.combine(
        format.colorize(),
        format.printf(({ level, message, timestamp, metadata }) => {
          return `${timestamp} ${level}: ${message} ${Object.keys(metadata).length ? JSON.stringify(metadata) : ''}`;
        })
      )
    }),
    // Logs généraux dans des fichiers rotatifs
    dailyRotateTransport,
    // Logs de sécurité séparés
    securityRotateTransport,
    // Transport d'erreurs uniquement
    new transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error'
    })
  ],
  exitOnError: false
});

// Ajouter une méthode pour les logs de sécurité spécifiques
logger.security = (message, metaData = {}) => {
  logger.warn(message, { ...metaData, securityEvent: true });
  
  // Si c'est une alerte critique, envoyer une notification
  if (metaData.critical) {
    // Ici on pourrait implémenter un système de notification 
    // comme l'envoi d'email, SMS ou webhook vers un service d'alerte
    console.error(`ALERTE CRITIQUE: ${message}`);
  }
};

// Fonction pour enregistrer les requêtes HTTP
logger.logHttpRequest = (req, res, next) => {
  const startHrTime = process.hrtime();
  
  // Une fois la réponse terminée
  res.on('finish', () => {
    // Calculer la durée de la requête
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedTimeInMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1000000;
    
    // Collecter les informations utiles de la requête
    const logData = {
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      responseTime: elapsedTimeInMs.toFixed(2) + 'ms',
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      userId: req.user ? req.user.id : 'guest'
    };
    
    // Déterminer le niveau de log en fonction du code de statut
    if (res.statusCode >= 500) {
      logger.error('Erreur serveur', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Erreur client', logData);
    } else {
      logger.http('Requête HTTP', logData);
    }
    
    // Détecter les comportements suspects
    if (
      res.statusCode === 401 || 
      res.statusCode === 403 || 
      (res.statusCode >= 400 && logData.url.includes('/api/users'))
    ) {
      // Si c'est une tentative échouée d'authentification ou d'accès à une ressource protégée
      logger.security('Tentative d\'accès non autorisé', {
        ...logData,
        critical: res.statusCode === 401 && logData.url.includes('/api/users/login')
      });
    }
  });
  
  next();
};

// Ajouter un handler pour les rejets de promesses non gérés
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Rejet de promesse non géré', { reason, stack: reason.stack });
});

// Ajouter un handler pour les exceptions non gérées
process.on('uncaughtException', (error) => {
  logger.error('Exception non gérée', { error, stack: error.stack });
  
  // En production, il est généralement recommandé de redémarrer l'application
  // après une exception non gérée pour éviter un état inconsistant
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

module.exports = logger;
