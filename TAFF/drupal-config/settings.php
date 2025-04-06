<?php
/**
 * Configuration Drupal pour le site de compétition e-sport
 */

// Paramètres de base de données
$databases['default']['default'] = [
  'database' => 'esport_drupal',
  'username' => 'esport_drupal_user',
  'password' => 'change_this_password',
  'host' => 'localhost',
  'port' => '3306',
  'driver' => 'mysql',
  'prefix' => 'drupal_',
  'collation' => 'utf8mb4_general_ci',
];

// Paramètres du site
$settings['hash_salt'] = 'change_this_to_a_random_string';
$settings['update_free_access'] = FALSE;
$settings['container_yamls'][] = $app_root . '/' . $site_path . '/services.yml';

// Configuration des chemins
$settings['file_public_path'] = 'sites/default/files';
$settings['file_private_path'] = '../private_files';
$settings['file_temp_path'] = '../tmp';

// Configuration du cache
$settings['cache']['bins']['render'] = 'cache.backend.database';
$settings['cache']['bins']['dynamic_page_cache'] = 'cache.backend.database';
$settings['cache']['bins']['page'] = 'cache.backend.database';

// Configuration du proxy
$settings['reverse_proxy'] = FALSE;
$settings['reverse_proxy_addresses'] = ['127.0.0.1'];

// Configuration de la sécurité
$settings['trusted_host_patterns'] = [
  '^localhost$',
  '^127\.0\.0\.1$',
  '^esport\.example\.com$',
];

// Configuration de l'intégration avec le site e-sport
$config['esport_integration.settings'] = [
  'api_url' => 'http://localhost:5000/api',
  'api_key' => 'change_this_api_key',
  'sync_interval' => 3600,
  'enable_sso' => TRUE,
];

// Configuration des modules personnalisés
$config['esport_competitions.settings'] = [
  'display_limit' => 10,
  'enable_registration' => TRUE,
  'enable_results' => TRUE,
];

$config['esport_users.settings'] = [
  'enable_profiles' => TRUE,
  'require_email_verification' => TRUE,
];

// Configuration du thème
$config['system.theme']['default'] = 'esport_theme';
$config['system.theme']['admin'] = 'claro';

// Configuration des langues
$config['language.negotiation']['url']['prefixes'] = [
  'en' => '',
  'fr' => 'fr',
];

// Configuration des emails
$config['system.site']['mail'] = 'noreply@example.com';
$config['system.site']['mail_notification'] = 'noreply@example.com';

// Configuration de l'intégration avec WordPress
$config['wordpress_integration.settings'] = [
  'wp_url' => 'http://localhost:5000/blog',
  'enable_sso' => TRUE,
  'sync_users' => TRUE,
];

// Configuration des modules de paiement
$config['commerce_payment.commerce_payment_gateway.stripe']['configuration'] = [
  'publishable_key' => 'pk_test_your_key',
  'secret_key' => 'sk_test_your_key',
];

$config['commerce_payment.commerce_payment_gateway.paypal']['configuration'] = [
  'client_id' => 'your_client_id',
  'client_secret' => 'your_client_secret',
];

// Configuration des modules d'analyse
$config['google_analytics.settings']['account'] = 'UA-XXXXX-Y';

// Configuration de la newsletter
$config['simplenews.settings']['mail']['from_address'] = 'noreply@example.com';
$config['simplenews.settings']['mail']['from_name'] = 'E-Sport Competition';

// Configuration des médias sociaux
$config['social_media.settings'] = [
  'facebook' => 'https://facebook.com/esportcompetition',
  'twitter' => 'https://twitter.com/esportcomp',
  'instagram' => 'https://instagram.com/esportcompetition',
  'youtube' => 'https://youtube.com/esportcompetition',
  'discord' => 'https://discord.gg/esportcompetition',
];

// Configuration de l'API REST
$config['rest.settings']['resources'] = [
  'entity:node' => [
    'GET' => [
      'supported_formats' => [
        'json',
      ],
      'supported_auth' => [
        'basic_auth',
        'cookie',
      ],
    ],
  ],
  'entity:user' => [
    'GET' => [
      'supported_formats' => [
        'json',
      ],
      'supported_auth' => [
        'basic_auth',
        'cookie',
      ],
    ],
  ],
  'esport_competitions:competition' => [
    'GET' => [
      'supported_formats' => [
        'json',
      ],
      'supported_auth' => [
        'basic_auth',
        'cookie',
      ],
    ],
  ],
  'esport_results:result' => [
    'GET' => [
      'supported_formats' => [
        'json',
      ],
      'supported_auth' => [
        'basic_auth',
        'cookie',
      ],
    ],
  ],
];

// Configuration de la journalisation
$config['system.logging']['error_level'] = 'hide';

// Configuration de la maintenance
$settings['maintenance_mode_message'] = 'Le site est actuellement en maintenance. Nous serons de retour très bientôt.';

// Configuration des performances
$config['system.performance']['css']['preprocess'] = TRUE;
$config['system.performance']['js']['preprocess'] = TRUE;
$config['system.performance']['cache']['page']['max_age'] = 3600;

// Configuration des modules personnalisés pour l'e-sport
$config['esport_calendar.settings'] = [
  'display_past_events' => FALSE,
  'max_future_events' => 20,
  'enable_notifications' => TRUE,
];

$config['esport_rankings.settings'] = [
  'points_for_win' => 3,
  'points_for_draw' => 1,
  'points_for_loss' => 0,
  'display_limit' => 20,
];

// Fin de la configuration
