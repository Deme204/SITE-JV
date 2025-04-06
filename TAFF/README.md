# Site de gestion de compétition e-sport

Ce site personnalisé permet la gestion complète d'une compétition annuelle d'e-sport. Il inclut la création de compte, le paiement des inscriptions, la gestion des résultats, et bien plus encore, le tout dans un environnement sécurisé et visuellement attrayant.

## Technologies utilisées

### Frontend
- HTML5 / CSS3 avec variables CSS et animations modernes
- JavaScript ES6+ pour les interactions dynamiques
- Design responsive adapté à tous les appareils
- Google Fonts (Poppins) pour une typographie moderne

### Backend
- PHP 8.1 pour le traitement côté serveur
- Node.js et Express pour l'API RESTful
- MongoDB pour la base de données principale
- Intégration WordPress pour la gestion de contenu (blog, actualités)

### Sécurité
- Authentification sécurisée avec JWT
- Protection contre les injections SQL et XSS
- Chiffrement des données sensibles
- Validation des entrées utilisateur

### Design
- Charte graphique personnalisée aux couleurs du e-sport
- Interface utilisateur intuitive et moderne
- Animations et transitions fluides
- Thème sombre avec accents colorés

## Fonctionnalités
- Création de compte et gestion de profil
- Paiement en ligne sécurisé (intégration Stripe/PayPal)
- Gestion des résultats en temps réel
- Validation des résultats par les deux participants
- Système d'accession et rétrogradation automatique
- Affichage du règlement personnalisable
- Sécurisation complète de la base de données
- Création et gestion de multiples compétitions sur différents jeux
- Newsletter automatisée avec templates personnalisables
- Calendrier interactif des rencontres avec notifications
- Panneau d'administration complet et intuitif
- Statistiques et analytics des compétitions

## Structure du site
- Accueil (`index.html`) - Présentation des compétitions et actualités
- Inscription (`inscription.html`) - Création de compte et inscription aux compétitions
- Connexion (`connexion.html`) - Authentification sécurisée
- Résultats (`resultats.html`) - Consultation et soumission des résultats
- Calendrier (`calendrier.html`) - Planning interactif des matchs
- Classement (`classement.html`) - Classements dynamiques par jeu et division
- Règlement (`reglement.html`) - Règles des compétitions
- Paiement (`paiement.html`) - Processus de paiement sécurisé
- Administration (`administration.html`) - Gestion complète du site
- Newsletter (`newsletter.html`) - Gestion des abonnements
- Blog - Articles et actualités (géré via WordPress)

## Installation

### Prérequis
- PHP 8.1 ou supérieur
- Node.js 14 ou supérieur
- MongoDB 4.4 ou supérieur
- WordPress 6.0 ou supérieur (pour le blog)

### Étapes d'installation
1. Clonez le dépôt: `git clone [url-du-repo]`
2. Installez les dépendances PHP: `composer install`
3. Installez les dépendances Node.js: `npm install`
4. Configurez la base de données MongoDB
5. Configurez l'intégration WordPress (voir documentation)
6. Configurez les variables d'environnement dans le fichier `.env`
7. Démarrez le serveur: `npm start`

## Utilisation
Accédez au site via `http://localhost:5000` ou votre domaine configuré.

## Personnalisation
Le site est entièrement personnalisable via:
- Le panneau d'administration
- Les fichiers de configuration
- La modification des templates
- L'ajustement de la charte graphique

## Support et maintenance
Un support technique est disponible pour toute question ou problème. Des mises à jour régulières sont prévues pour améliorer les fonctionnalités et la sécurité.
