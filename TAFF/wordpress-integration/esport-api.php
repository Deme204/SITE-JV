<?php
/**
 * Plugin Name: E-Sport Competition Integration
 * Description: Intégration entre WordPress et le site de compétition e-sport
 * Version: 1.0.0
 * Author: E-Sport Competition Team
 */

// Sécurité
if (!defined('ABSPATH')) {
    exit; // Sortie si accès direct
}

class EsportCompetitionIntegration {
    private $api_url;
    private $api_key;

    /**
     * Constructeur
     */
    public function __construct() {
        $this->api_url = defined('ESPORT_API_URL') ? ESPORT_API_URL : 'http://localhost:5000/api';
        $this->api_key = defined('ESPORT_API_KEY') ? ESPORT_API_KEY : '';

        // Initialisation des hooks
        add_action('init', array($this, 'register_post_types'));
        add_action('init', array($this, 'register_shortcodes'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('admin_enqueue_scripts', array($this, 'admin_enqueue_scripts'));
        
        // Synchronisation automatique
        add_action('esport_sync_cron', array($this, 'sync_competitions'));
        
        // Activation du cron si pas déjà fait
        if (!wp_next_scheduled('esport_sync_cron')) {
            wp_schedule_event(time(), 'hourly', 'esport_sync_cron');
        }
        
        // SSO (Single Sign-On)
        if (defined('ESPORT_SSO_ENABLED') && ESPORT_SSO_ENABLED) {
            add_action('wp_login', array($this, 'sync_login'), 10, 2);
            add_action('wp_logout', array($this, 'sync_logout'));
        }
    }

    /**
     * Enregistrement des types de contenu personnalisés
     */
    public function register_post_types() {
        // Type de contenu pour les compétitions
        register_post_type('esport_competition', array(
            'labels' => array(
                'name' => 'Compétitions',
                'singular_name' => 'Compétition',
            ),
            'public' => true,
            'has_archive' => true,
            'supports' => array('title', 'editor', 'thumbnail', 'excerpt'),
            'menu_icon' => 'dashicons-awards',
        ));
        
        // Type de contenu pour les résultats
        register_post_type('esport_result', array(
            'labels' => array(
                'name' => 'Résultats',
                'singular_name' => 'Résultat',
            ),
            'public' => true,
            'has_archive' => true,
            'supports' => array('title', 'editor'),
            'menu_icon' => 'dashicons-list-view',
        ));
    }

    /**
     * Enregistrement des shortcodes
     */
    public function register_shortcodes() {
        add_shortcode('esport_competitions', array($this, 'shortcode_competitions'));
        add_shortcode('esport_results', array($this, 'shortcode_results'));
        add_shortcode('esport_calendar', array($this, 'shortcode_calendar'));
        add_shortcode('esport_ranking', array($this, 'shortcode_ranking'));
    }

    /**
     * Ajout du menu d'administration
     */
    public function add_admin_menu() {
        add_menu_page(
            'E-Sport Integration',
            'E-Sport',
            'manage_options',
            'esport-integration',
            array($this, 'admin_page'),
            'dashicons-games',
            30
        );
        
        add_submenu_page(
            'esport-integration',
            'Synchronisation',
            'Synchronisation',
            'manage_options',
            'esport-sync',
            array($this, 'sync_page')
        );
        
        add_submenu_page(
            'esport-integration',
            'Paramètres',
            'Paramètres',
            'manage_options',
            'esport-settings',
            array($this, 'settings_page')
        );
    }

    /**
     * Chargement des scripts et styles
     */
    public function enqueue_scripts() {
        wp_enqueue_style(
            'esport-integration-css',
            plugin_dir_url(__FILE__) . 'assets/css/esport-public.css',
            array(),
            '1.0.0'
        );
        
        wp_enqueue_script(
            'esport-integration-js',
            plugin_dir_url(__FILE__) . 'assets/js/esport-public.js',
            array('jquery'),
            '1.0.0',
            true
        );
        
        wp_localize_script('esport-integration-js', 'esport_data', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('esport-nonce'),
        ));
    }

    /**
     * Chargement des scripts et styles d'administration
     */
    public function admin_enqueue_scripts($hook) {
        if (strpos($hook, 'esport-') === false) {
            return;
        }
        
        wp_enqueue_style(
            'esport-admin-css',
            plugin_dir_url(__FILE__) . 'assets/css/esport-admin.css',
            array(),
            '1.0.0'
        );
        
        wp_enqueue_script(
            'esport-admin-js',
            plugin_dir_url(__FILE__) . 'assets/js/esport-admin.js',
            array('jquery'),
            '1.0.0',
            true
        );
    }

    /**
     * Page d'administration principale
     */
    public function admin_page() {
        include plugin_dir_path(__FILE__) . 'templates/admin-main.php';
    }

    /**
     * Page de synchronisation
     */
    public function sync_page() {
        // Traitement de la synchronisation manuelle
        if (isset($_POST['esport_sync']) && check_admin_referer('esport_sync_nonce')) {
            $this->sync_competitions();
            echo '<div class="notice notice-success"><p>Synchronisation réussie!</p></div>';
        }
        
        include plugin_dir_path(__FILE__) . 'templates/admin-sync.php';
    }

    /**
     * Page de paramètres
     */
    public function settings_page() {
        // Traitement de la sauvegarde des paramètres
        if (isset($_POST['esport_settings']) && check_admin_referer('esport_settings_nonce')) {
            update_option('esport_api_url', sanitize_text_field($_POST['api_url']));
            update_option('esport_api_key', sanitize_text_field($_POST['api_key']));
            echo '<div class="notice notice-success"><p>Paramètres sauvegardés!</p></div>';
        }
        
        include plugin_dir_path(__FILE__) . 'templates/admin-settings.php';
    }

    /**
     * Synchronisation des compétitions
     */
    public function sync_competitions() {
        $competitions = $this->fetch_from_api('/competitions');
        
        if (!$competitions || empty($competitions)) {
            return false;
        }
        
        foreach ($competitions as $competition) {
            $this->update_or_create_competition($competition);
        }
        
        return true;
    }

    /**
     * Mise à jour ou création d'une compétition
     */
    private function update_or_create_competition($competition) {
        // Recherche si la compétition existe déjà
        $args = array(
            'post_type' => 'esport_competition',
            'meta_query' => array(
                array(
                    'key' => 'esport_competition_id',
                    'value' => $competition->id,
                ),
            ),
        );
        
        $query = new WP_Query($args);
        
        if ($query->have_posts()) {
            // Mise à jour
            $post_id = $query->posts[0]->ID;
            
            wp_update_post(array(
                'ID' => $post_id,
                'post_title' => $competition->name,
                'post_content' => $competition->description,
                'post_status' => 'publish',
            ));
        } else {
            // Création
            $post_id = wp_insert_post(array(
                'post_title' => $competition->name,
                'post_content' => $competition->description,
                'post_status' => 'publish',
                'post_type' => 'esport_competition',
            ));
        }
        
        // Mise à jour des métadonnées
        update_post_meta($post_id, 'esport_competition_id', $competition->id);
        update_post_meta($post_id, 'esport_game', $competition->game);
        update_post_meta($post_id, 'esport_start_date', $competition->start_date);
        update_post_meta($post_id, 'esport_end_date', $competition->end_date);
        update_post_meta($post_id, 'esport_registration_fee', $competition->registration_fee);
        
        return $post_id;
    }

    /**
     * Récupération des données depuis l'API
     */
    private function fetch_from_api($endpoint) {
        $url = $this->api_url . $endpoint;
        
        $args = array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $this->api_key,
            ),
        );
        
        $response = wp_remote_get($url, $args);
        
        if (is_wp_error($response)) {
            return false;
        }
        
        $body = wp_remote_retrieve_body($response);
        return json_decode($body);
    }

    /**
     * Shortcode pour afficher les compétitions
     */
    public function shortcode_competitions($atts) {
        $atts = shortcode_atts(array(
            'limit' => 5,
            'game' => '',
        ), $atts);
        
        $args = array(
            'post_type' => 'esport_competition',
            'posts_per_page' => $atts['limit'],
            'post_status' => 'publish',
        );
        
        if (!empty($atts['game'])) {
            $args['meta_query'] = array(
                array(
                    'key' => 'esport_game',
                    'value' => $atts['game'],
                ),
            );
        }
        
        $query = new WP_Query($args);
        
        ob_start();
        include plugin_dir_path(__FILE__) . 'templates/shortcode-competitions.php';
        return ob_get_clean();
    }

    /**
     * Shortcode pour afficher les résultats
     */
    public function shortcode_results($atts) {
        $atts = shortcode_atts(array(
            'limit' => 10,
            'competition_id' => '',
        ), $atts);
        
        // Récupération des résultats depuis l'API
        $endpoint = '/results';
        if (!empty($atts['competition_id'])) {
            $endpoint .= '?competition_id=' . $atts['competition_id'];
        }
        
        $results = $this->fetch_from_api($endpoint);
        
        ob_start();
        include plugin_dir_path(__FILE__) . 'templates/shortcode-results.php';
        return ob_get_clean();
    }

    /**
     * Shortcode pour afficher le calendrier
     */
    public function shortcode_calendar($atts) {
        $atts = shortcode_atts(array(
            'competition_id' => '',
        ), $atts);
        
        // Récupération du calendrier depuis l'API
        $endpoint = '/calendar';
        if (!empty($atts['competition_id'])) {
            $endpoint .= '?competition_id=' . $atts['competition_id'];
        }
        
        $calendar = $this->fetch_from_api($endpoint);
        
        ob_start();
        include plugin_dir_path(__FILE__) . 'templates/shortcode-calendar.php';
        return ob_get_clean();
    }

    /**
     * Shortcode pour afficher le classement
     */
    public function shortcode_ranking($atts) {
        $atts = shortcode_atts(array(
            'competition_id' => '',
            'limit' => 10,
        ), $atts);
        
        // Récupération du classement depuis l'API
        $endpoint = '/ranking';
        if (!empty($atts['competition_id'])) {
            $endpoint .= '?competition_id=' . $atts['competition_id'];
        }
        
        $ranking = $this->fetch_from_api($endpoint);
        
        ob_start();
        include plugin_dir_path(__FILE__) . 'templates/shortcode-ranking.php';
        return ob_get_clean();
    }

    /**
     * Synchronisation de la connexion
     */
    public function sync_login($user_login, $user) {
        // Envoi des informations de connexion à l'API e-sport
        $url = $this->api_url . '/auth/wordpress-login';
        
        $args = array(
            'method' => 'POST',
            'headers' => array(
                'Authorization' => 'Bearer ' . $this->api_key,
                'Content-Type' => 'application/json',
            ),
            'body' => json_encode(array(
                'user_id' => $user->ID,
                'user_login' => $user_login,
                'user_email' => $user->user_email,
                'secret' => defined('ESPORT_SSO_SECRET') ? ESPORT_SSO_SECRET : '',
            )),
        );
        
        wp_remote_post($url, $args);
    }

    /**
     * Synchronisation de la déconnexion
     */
    public function sync_logout() {
        $user = wp_get_current_user();
        
        if (!$user || !$user->ID) {
            return;
        }
        
        // Envoi des informations de déconnexion à l'API e-sport
        $url = $this->api_url . '/auth/wordpress-logout';
        
        $args = array(
            'method' => 'POST',
            'headers' => array(
                'Authorization' => 'Bearer ' . $this->api_key,
                'Content-Type' => 'application/json',
            ),
            'body' => json_encode(array(
                'user_id' => $user->ID,
                'secret' => defined('ESPORT_SSO_SECRET') ? ESPORT_SSO_SECRET : '',
            )),
        );
        
        wp_remote_post($url, $args);
    }
}

// Initialisation du plugin
$esport_integration = new EsportCompetitionIntegration();
