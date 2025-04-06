/**
 * Modèle Utilisateur
 * Structure de données complète pour la gestion des utilisateurs
 * avec fonctionnalités avancées de sécurité et profil détaillé
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Sous-schéma pour les détails de sécurité
const SecurityDetailsSchema = new Schema({
  lastLogin: {
    type: Date,
    default: null
  },
  lastPasswordChange: {
    type: Date,
    default: Date.now
  },
  passwordHistory: [{
    password: String,
    changedAt: Date
  }],
  loginAttempts: {
    type: Number,
    default: 0
  },
  locked: {
    type: Boolean,
    default: false
  },
  lockUntil: {
    type: Date,
    default: null
  },
  ipHistory: [{
    type: String
  }],
  userAgent: String,
  securityQuestions: [{
    question: String,
    answer: String // Stocké haché
  }]
});

// Sous-schéma pour l'authentification à deux facteurs
const TwoFactorAuthSchema = new Schema({
  enabled: {
    type: Boolean,
    default: false
  },
  secret: String,
  backupCodes: [{
    code: String,
    used: {
      type: Boolean,
      default: false
    }
  }],
  lastUsed: Date
});

// Sous-schéma pour les préférences utilisateur
const PreferencesSchema = new Schema({
  language: {
    type: String,
    default: 'fr'
  },
  emailNotifications: {
    tournaments: {
      type: Boolean,
      default: true
    },
    results: {
      type: Boolean,
      default: true
    },
    news: {
      type: Boolean,
      default: true
    },
    security: {
      type: Boolean,
      default: true
    }
  },
  pushNotifications: {
    enabled: {
      type: Boolean,
      default: false
    },
    token: String,
    platform: String // 'ios', 'android', 'web'
  },
  darkMode: {
    type: Boolean,
    default: false
  },
  timezone: String
});

// Sous-schéma pour le profil esport
const EsportProfileSchema = new Schema({
  nickname: String,
  games: [{
    name: String,
    level: String,
    rank: String,
    verified: {
      type: Boolean,
      default: false
    }
  }],
  teams: [{
    name: String,
    role: String,
    joinedAt: Date,
    leftAt: Date
  }],
  platforms: [{
    name: String, // 'pc', 'ps5', 'xbox', etc.
    username: String,
    verified: {
      type: Boolean,
      default: false
    }
  }],
  socialLinks: {
    twitch: String,
    youtube: String,
    twitter: String,
    discord: String,
    instagram: String
  },
  achievements: [{
    title: String,
    description: String,
    date: Date,
    icon: String
  }]
});

// Schéma principal utilisateur
const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  firstName: String,
  lastName: String,
  avatar: String,
  bio: {
    type: String,
    maxlength: 500
  },
  verified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user'
  },
  securityDetails: {
    type: SecurityDetailsSchema,
    default: () => ({})
  },
  twoFactorAuth: {
    type: TwoFactorAuthSchema,
    default: () => ({})
  },
  preferences: {
    type: PreferencesSchema,
    default: () => ({})
  },
  esportProfile: {
    type: EsportProfileSchema,
    default: () => ({})
  },
  walletBalance: {
    type: Number,
    default: 0
  },
  subscriptionTier: {
    type: String,
    enum: ['free', 'premium', 'pro'],
    default: 'free'
  },
  subscriptionValidUntil: Date,
  paymentMethods: [{
    type: {
      type: String,
      enum: ['card', 'paypal', 'bank_transfer', 'crypto']
    },
    details: {
      lastFour: String,
      expiryDate: String,
      brand: String
    },
    isDefault: Boolean,
    tokenized: String // Token chiffré représentant le moyen de paiement
  }],
  // Sessions invalidées (pour forcer la déconnexion)
  invalidatedSessions: [String],
  active: {
    type: Boolean,
    default: true
  },
  lastActive: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index pour optimiser les requêtes fréquentes
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ 'esportProfile.nickname': 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ verified: 1 });
UserSchema.index({ createdAt: -1 });

// Méthode pour vérifier si le compte est verrouillé
UserSchema.methods.isLocked = function() {
  // Vérifier si le compte est marqué comme verrouillé
  if (!this.securityDetails.locked) {
    return false;
  }
  
  // Si une date de déverrouillage est définie, vérifier si elle est passée
  if (this.securityDetails.lockUntil && this.securityDetails.lockUntil < new Date()) {
    // Déverrouiller automatiquement le compte si la période est écoulée
    this.securityDetails.locked = false;
    this.securityDetails.loginAttempts = 0;
    this.save();
    return false;
  }
  
  return true;
};

// Middleware pré-enregistrement pour mettre à jour le champ updatedAt
UserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Middleware pré-recherche pour exclure les utilisateurs désactivés
UserSchema.pre('find', function() {
  this.where({ active: { $ne: false } });
});

UserSchema.pre('findOne', function() {
  this.where({ active: { $ne: false } });
});

// Méthode pour comparer les mots de passe (sera implémentée avec bcrypt)
UserSchema.methods.comparePassword = async function(password) {
  const bcrypt = require('bcrypt');
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);
