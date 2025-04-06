/**
 * Modèle de journal d'activité
 * Enregistre toutes les actions des utilisateurs pour l'audit, 
 * la sécurité et l'analyse comportementale
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ActivityLogSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      // Actions d'authentification
      'REGISTER', 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 
      'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_SUCCESS', 'PASSWORD_CHANGED',
      'EMAIL_VERIFICATION_REQUEST', 'EMAIL_VERIFIED',
      'TWO_FACTOR_ENABLED', 'TWO_FACTOR_DISABLED', 'TWO_FACTOR_VERIFIED',
      
      // Actions de compte
      'PROFILE_UPDATED', 'AVATAR_CHANGED', 'EMAIL_CHANGED',
      'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED', 'ACCOUNT_DELETED',
      
      // Actions de compétition
      'TOURNAMENT_REGISTRATION', 'TOURNAMENT_CANCELLATION', 'MATCH_RESULT_SUBMITTED',
      'MATCH_RESULT_CONTESTED', 'MATCH_RESULT_VALIDATED',
      
      // Actions financières
      'PAYMENT_INITIATED', 'PAYMENT_COMPLETED', 'PAYMENT_FAILED',
      'REFUND_REQUESTED', 'REFUND_PROCESSED', 'SUBSCRIPTION_STARTED',
      'SUBSCRIPTION_RENEWED', 'SUBSCRIPTION_CANCELLED',
      
      // Actions administratives
      'ADMIN_LOGIN', 'TOURNAMENT_CREATED', 'TOURNAMENT_UPDATED', 'TOURNAMENT_DELETED',
      'USER_BANNED', 'USER_UNBANNED', 'SYSTEM_SETTINGS_UPDATED',
      
      // Actions de contenu
      'COMMENT_ADDED', 'COMMENT_EDITED', 'COMMENT_DELETED',
      'CONTENT_VIEWED', 'FILE_UPLOADED', 'FILE_DOWNLOADED'
    ]
  },
  ip: {
    type: String,
    required: true
  },
  userAgent: String,
  details: {
    type: String,
    default: ''
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['success', 'failure', 'warning', 'info'],
    default: 'success'
  },
  securityEvent: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '90d' // TTL index - purger les entrées après 90 jours
  }
});

// Index pour optimiser les requêtes
ActivityLogSchema.index({ userId: 1, createdAt: -1 });
ActivityLogSchema.index({ action: 1, createdAt: -1 });
ActivityLogSchema.index({ securityEvent: 1, createdAt: -1 });
ActivityLogSchema.index({ ip: 1, createdAt: -1 });

// Méthode statique pour récupérer les dernières activités d'un utilisateur
ActivityLogSchema.statics.getRecentUserActivity = async function(userId, limit = 10) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Méthode statique pour récupérer les événements de sécurité récents
ActivityLogSchema.statics.getRecentSecurityEvents = async function(limit = 100) {
  return this.find({ securityEvent: true })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Méthode statique pour détecter les comportements suspects
ActivityLogSchema.statics.detectSuspiciousActivity = async function(userId) {
  const pipeline = [
    { $match: { userId: mongoose.Types.ObjectId(userId), action: 'LOGIN_FAILED' } },
    { $group: { _id: null, count: { $sum: 1 } } }
  ];
  
  const failedLogins = await this.aggregate(pipeline);
  const failedCount = failedLogins.length > 0 ? failedLogins[0].count : 0;
  
  // Retourner true si plus de 3 échecs de connexion dans l'historique
  return failedCount > 3;
};

// Méthode statique pour obtenir des statistiques d'activité utilisateur
ActivityLogSchema.statics.getUserActivityStats = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const pipeline = [
    { 
      $match: { 
        userId: mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      } 
    },
    { 
      $group: { 
        _id: { 
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } 
        },
        count: { $sum: 1 },
        actions: { $push: "$action" }
      } 
    },
    { $sort: { _id: 1 } }
  ];
  
  return this.aggregate(pipeline);
};

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
