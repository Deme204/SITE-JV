<?php
/**
 * Configuration PHP pour le site de compétition e-sport
 * Gestion des paramètres de base de données et des fonctionnalités
 */

// Informations de connexion à la base de données
define('DB_HOST', 'localhost');
define('DB_NAME', 'esport_competition');
define('DB_USER', 'esport_user');
define('DB_PASS', 'change_this_password');
define('DB_CHARSET', 'utf8mb4');

// Configuration de l'application
define('APP_NAME', 'E-Sport Competition');
define('APP_URL', 'http://localhost:5000');
define('APP_ENV', 'development'); // 'development' ou 'production'
define('APP_DEBUG', true);        // Désactiver en production
define('APP_VERSION', '1.0.0');

// Sécurité
define('SECURITY_SALT', 'change_this_to_a_random_string');
define('JWT_SECRET', 'change_this_to_a_random_string');
define('PASSWORD_HASH_COST', 12); // Coût de hachage bcrypt

// Configuration des emails
define('MAIL_HOST', 'smtp.example.com');
define('MAIL_PORT', 587);
define('MAIL_USERNAME', 'noreply@example.com');
define('MAIL_PASSWORD', 'change_this_password');
define('MAIL_ENCRYPTION', 'tls');
define('MAIL_FROM_ADDRESS', 'noreply@example.com');
define('MAIL_FROM_NAME', 'E-Sport Competition');

// Configuration des paiements
define('PAYMENT_GATEWAY', 'stripe'); // 'stripe', 'paypal', etc.
define('STRIPE_PUBLIC_KEY', 'pk_test_your_key');
define('STRIPE_SECRET_KEY', 'sk_test_your_key');
define('PAYPAL_CLIENT_ID', 'your_client_id');
define('PAYPAL_CLIENT_SECRET', 'your_client_secret');
define('PAYMENT_CURRENCY', 'EUR');

// Configuration de l'intégration WordPress
define('WP_INTEGRATION', true);
define('WP_API_URL', 'http://localhost:5000/blog/wp-json');
define('WP_API_KEY', 'change_this_api_key');

// Chemins de l'application
define('ROOT_PATH', dirname(__DIR__));
define('CONFIG_PATH', ROOT_PATH . '/config');
define('PUBLIC_PATH', ROOT_PATH . '/public');
define('UPLOAD_PATH', PUBLIC_PATH . '/uploads');
define('TEMPLATE_PATH', ROOT_PATH . '/templates');
define('CACHE_PATH', ROOT_PATH . '/cache');
define('LOG_PATH', ROOT_PATH . '/logs');

// Timezone
date_default_timezone_set('Europe/Paris');

// Paramètres de session
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_secure', 0); // Mettre à 1 en production avec HTTPS
session_name('esport_session');

// Fonction de connexion à la base de données
function getDbConnection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        
        return new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch (PDOException $e) {
        if (APP_DEBUG) {
            die("Erreur de connexion à la base de données: " . $e->getMessage());
        } else {
            die("Erreur de connexion à la base de données. Veuillez contacter l'administrateur.");
        }
    }
}

// Fonction de journalisation
function logMessage($message, $level = 'info') {
    $date = date('Y-m-d H:i:s');
    $logFile = LOG_PATH . '/' . date('Y-m-d') . '.log';
    
    // Créer le répertoire de logs s'il n'existe pas
    if (!is_dir(LOG_PATH)) {
        mkdir(LOG_PATH, 0755, true);
    }
    
    $logMessage = "[$date] [$level] $message" . PHP_EOL;
    file_put_contents($logFile, $logMessage, FILE_APPEND);
}

// Fonction de nettoyage des entrées utilisateur
function sanitizeInput($data) {
    if (is_array($data)) {
        foreach ($data as $key => $value) {
            $data[$key] = sanitizeInput($value);
        }
    } else {
        $data = trim($data);
        $data = stripslashes($data);
        $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    }
    
    return $data;
}

// Fonction de génération de token JWT
function generateJwtToken($userId, $expiration = 3600) {
    $issuedAt = time();
    $expire = $issuedAt + $expiration;
    
    $payload = [
        'iat' => $issuedAt,
        'exp' => $expire,
        'user_id' => $userId
    ];
    
    // En production, utilisez une bibliothèque JWT complète
    $header = base64_encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
    $payload = base64_encode(json_encode($payload));
    $signature = base64_encode(hash_hmac('sha256', "$header.$payload", JWT_SECRET, true));
    
    return "$header.$payload.$signature";
}

// Initialisation de la session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Vérification des répertoires nécessaires
$requiredDirs = [
    UPLOAD_PATH,
    CACHE_PATH,
    LOG_PATH
];

foreach ($requiredDirs as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
}

// Inclusion des fichiers de fonctions utilitaires
require_once CONFIG_PATH . '/functions.php';

// Chargement des classes via autoload
spl_autoload_register(function ($className) {
    $className = str_replace('\\', '/', $className);
    $file = ROOT_PATH . '/src/' . $className . '.php';
    
    if (file_exists($file)) {
        require_once $file;
    }
});
