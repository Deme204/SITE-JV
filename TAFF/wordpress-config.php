<?php
/**
 * Configuration de base pour WordPress
 * Intégration avec le site de compétition e-sport
 */

// Configuration de la base de données WordPress
define('DB_NAME', 'esport_wp_db');
define('DB_USER', 'esport_admin');
define('DB_PASSWORD', 'change_this_password');
define('DB_HOST', 'localhost');
define('DB_CHARSET', 'utf8mb4');
define('DB_COLLATE', '');

// Clés de sécurité uniques
// Générez-les sur https://api.wordpress.org/secret-key/1.1/salt/
define('AUTH_KEY',         'clé-unique-à-générer');
define('SECURE_AUTH_KEY',  'clé-unique-à-générer');
define('LOGGED_IN_KEY',    'clé-unique-à-générer');
define('NONCE_KEY',        'clé-unique-à-générer');
define('AUTH_SALT',        'clé-unique-à-générer');
define('SECURE_AUTH_SALT', 'clé-unique-à-générer');
define('LOGGED_IN_SALT',   'clé-unique-à-générer');
define('NONCE_SALT',       'clé-unique-à-générer');

// Préfixe des tables
$table_prefix = 'esport_wp_';

// Intégration avec l'API du site e-sport
define('ESPORT_API_URL', 'http://localhost:5000/api');
define('ESPORT_API_KEY', 'change_this_api_key');

// Mode débogage
define('WP_DEBUG', false);

// Chemin absolu vers le répertoire WordPress
if (!defined('ABSPATH')) {
    define('ABSPATH', __DIR__ . '/wordpress/');
}

// Configuration de l'URL du site
define('WP_HOME', 'http://localhost:5000/blog');
define('WP_SITEURL', 'http://localhost:5000/blog');

// Configuration des cookies
define('COOKIE_DOMAIN', 'localhost');

// Intégration SSO (Single Sign-On)
define('ESPORT_SSO_ENABLED', true);
define('ESPORT_SSO_SECRET', 'change_this_secret');

// Inclusion du fichier wp-settings.php
require_once ABSPATH . 'wp-settings.php';
