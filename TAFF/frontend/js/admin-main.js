/**
 * Module principal - Panneau d'administration
 * Gère les fonctionnalités communes et l'interface principale
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialisation de l'interface
    initializeAdminInterface();
    
    // Initialisation des tableaux de bord
    initializeDashboards();
    
    // Gestionnaire d'événements pour la navigation
    setupNavigation();
    
    // Système de notifications
    setupNotifications();
    
    /**
     * Initialise l'interface d'administration
     */
    function initializeAdminInterface() {
        // Afficher/masquer la barre latérale sur mobile
        const toggleSidebarBtn = document.getElementById('toggleSidebar');
        const adminSidebar = document.querySelector('.admin-sidebar');
        
        if (toggleSidebarBtn && adminSidebar) {
            toggleSidebarBtn.addEventListener('click', function() {
                adminSidebar.classList.toggle('active');
                document.body.classList.toggle('sidebar-open');
            });
        }
        
        // Fermer la sidebar si on clique en dehors
        document.addEventListener('click', function(event) {
            if (adminSidebar && adminSidebar.classList.contains('active') &&
                !adminSidebar.contains(event.target) && 
                event.target !== toggleSidebarBtn) {
                adminSidebar.classList.remove('active');
                document.body.classList.remove('sidebar-open');
            }
        });
        
        // Afficher la date et l'heure actuelles
        updateDateTime();
        setInterval(updateDateTime, 60000); // Mise à jour toutes les minutes
        
        // Activer les tooltips
        const tooltips = document.querySelectorAll('[data-tooltip]');
        tooltips.forEach(tooltip => {
            tooltip.addEventListener('mouseenter', showTooltip);
            tooltip.addEventListener('mouseleave', hideTooltip);
        });
    }
    
    /**
     * Initialise les tableaux de bord et les widgets
     */
    function initializeDashboards() {
        // Charger les statistiques du dashboard
        loadDashboardStats();
        
        // Initialiser les graphiques si la bibliothèque Chart.js est disponible
        if (typeof Chart !== 'undefined') {
            initializeCharts();
        }
        
        // Activer les actions rapides du tableau de bord
        setupQuickActions();
    }
    
    /**
     * Configure la navigation entre les sections
     */
    function setupNavigation() {
        const navLinks = document.querySelectorAll('.admin-nav-link');
        const contentSections = document.querySelectorAll('.admin-content-section');
        
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Désactiver tous les liens
                navLinks.forEach(item => item.classList.remove('active'));
                
                // Activer le lien courant
                this.classList.add('active');
                
                // Masquer toutes les sections
                contentSections.forEach(section => section.classList.remove('active'));
                
                // Afficher la section cible
                const targetId = this.getAttribute('data-target');
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    targetSection.classList.add('active');
                    
                    // Mettre à jour le titre de la page
                    const pageTitle = document.querySelector('.page-title');
                    if (pageTitle) {
                        pageTitle.textContent = this.getAttribute('data-title') || this.textContent;
                    }
                    
                    // Si c'est la section système, actualiser l'état
                    if (targetId === 'systemSection') {
                        refreshSystemStatus();
                    }
                }
            });
        });
        
        // Activer la première section par défaut
        if (navLinks.length > 0) {
            navLinks[0].click();
        }
    }
    
    /**
     * Configuration du système de notifications
     */
    function setupNotifications() {
        // Conteneur des notifications
        if (!document.getElementById('notificationsContainer')) {
            const container = document.createElement('div');
            container.id = 'notificationsContainer';
            container.className = 'notifications-container';
            document.body.appendChild(container);
        }
        
        // Bouton de notifications en haut de la page
        const notifBadge = document.querySelector('.notifications-badge');
        const notifDropdown = document.querySelector('.notifications-dropdown');
        
        if (notifBadge && notifDropdown) {
            notifBadge.addEventListener('click', function(e) {
                e.stopPropagation();
                notifDropdown.classList.toggle('active');
                
                // Si actif, marquer comme lu
                if (notifDropdown.classList.contains('active')) {
                    this.setAttribute('data-count', '0');
                    this.classList.remove('has-notifications');
                }
            });
            
            // Fermer au clic ailleurs
            document.addEventListener('click', function(e) {
                if (notifDropdown && !notifDropdown.contains(e.target) && e.target !== notifBadge) {
                    notifDropdown.classList.remove('active');
                }
            });
        }
        
        // Charger les notifications de démonstration
        loadDemoNotifications();
    }
    
    /**
     * Charge les statistiques du tableau de bord
     */
    function loadDashboardStats() {
        const statsItems = document.querySelectorAll('.stat-card .stat-value');
        
        if (statsItems.length === 0) return;
        
        // Simuler le chargement des données
        statsItems.forEach(item => {
            item.innerHTML = '<div class="skeleton-loader"></div>';
        });
        
        // Dans une vraie application, ces données viendraient d'une API
        setTimeout(() => {
            const mockStats = {
                'totalCompetitions': '14',
                'activeTournaments': '5',
                'registeredPlayers': '1,246',
                'monthlySales': '8,450 €',
                'openTickets': '3',
                'serverUptime': '99.8%'
            };
            
            statsItems.forEach(item => {
                const statKey = item.getAttribute('data-stat');
                if (statKey && mockStats[statKey]) {
                    item.textContent = mockStats[statKey];
                } else {
                    item.textContent = '0';
                }
            });
        }, 1000);
    }
    
    /**
     * Initialise les graphiques sur le tableau de bord
     */
    function initializeCharts() {
        // Graphique des inscriptions
        const registrationsChart = document.getElementById('registrationsChart');
        if (registrationsChart) {
            new Chart(registrationsChart, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
                    datasets: [{
                        label: 'Inscriptions 2025',
                        data: [65, 78, 90, 105, 0, 0, 0, 0, 0, 0, 0, 0],
                        borderColor: '#6200EA',
                        backgroundColor: 'rgba(98, 0, 234, 0.1)',
                        tension: 0.4,
                        fill: true
                    }, {
                        label: 'Inscriptions 2024',
                        data: [50, 60, 75, 85, 95, 110, 120, 118, 130, 145, 160, 170],
                        borderColor: '#00E5FF',
                        backgroundColor: 'transparent',
                        tension: 0.4,
                        borderDash: [5, 5]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
        
        // Graphique des revenus
        const revenueChart = document.getElementById('revenueChart');
        if (revenueChart) {
            new Chart(revenueChart, {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
                    datasets: [{
                        label: 'Revenus (€)',
                        data: [4500, 5200, 6800, 8450, 0, 0],
                        backgroundColor: ['rgba(98, 0, 234, 0.7)', 'rgba(157, 70, 255, 0.7)', 
                                         'rgba(0, 229, 255, 0.7)', 'rgba(255, 64, 129, 0.7)',
                                         'rgba(0, 176, 255, 0.7)', 'rgba(0, 200, 83, 0.7)']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }
        
        // Graphique des jeux
        const gamesChart = document.getElementById('gamesDistributionChart');
        if (gamesChart) {
            new Chart(gamesChart, {
                type: 'pie',
                data: {
                    labels: ['League of Legends', 'Counter-Strike 2', 'Valorant', 'Rocket League', 'Fortnite', 'Autres'],
                    datasets: [{
                        data: [35, 25, 20, 10, 7, 3],
                        backgroundColor: [
                            '#6200EA', '#9D46FF', '#00E5FF', '#FF4081', '#00B0FF', '#00C853'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                        }
                    }
                }
            });
        }
    }
    
    /**
     * Configure les actions rapides du tableau de bord
     */
    function setupQuickActions() {
        const quickActions = document.querySelectorAll('[data-action]');
        
        quickActions.forEach(action => {
            action.addEventListener('click', function() {
                const actionType = this.getAttribute('data-action');
                
                switch (actionType) {
                    case 'new-competition':
                        // Géré par le module de compétitions
                        break;
                        
                    case 'export-data':
                        // Géré par le module d'exportation
                        break;
                        
                    case 'system-scan':
                        performSystemScan();
                        break;
                        
                    case 'clear-cache':
                        clearSystemCache();
                        break;
                        
                    case 'rebuild-index':
                        rebuildSearchIndex();
                        break;
                        
                    default:
                        console.log(`Action non implémentée: ${actionType}`);
                }
            });
        });
    }
    
    /**
     * Met à jour la date et l'heure dans l'en-tête
     */
    function updateDateTime() {
        const dateTimeElement = document.getElementById('currentDateTime');
        if (!dateTimeElement) return;
        
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        dateTimeElement.textContent = now.toLocaleDateString('fr-FR', options);
    }
    
    /**
     * Effectue un scan du système
     */
    function performSystemScan() {
        showNotification('Scan du système démarré. Cela peut prendre quelques instants...', 'info');
        
        // Afficher l'indicateur de chargement
        showLoadingOverlay('Scan du système en cours...');
        
        // Simuler le scan
        setTimeout(() => {
            hideLoadingOverlay();
            
            // Résultats du scan (dans une vraie application, viendraient d'une API)
            const scanResults = {
                status: 'success',
                issues: 0,
                scannedComponents: 7,
                details: {
                    database: { status: 'optimal', message: 'La base de données fonctionne normalement.' },
                    fileSystem: { status: 'optimal', message: 'Système de fichiers intègre.' },
                    cache: { status: 'optimal', message: 'Le cache est à jour.' },
                    api: { status: 'optimal', message: 'Toutes les API sont disponibles.' },
                    security: { status: 'optimal', message: 'Aucun problème de sécurité détecté.' },
                    performance: { status: 'optimal', message: 'Les performances sont optimales.' },
                    integrations: { status: 'optimal', message: 'Toutes les intégrations fonctionnent correctement.' }
                }
            };
            
            // Afficher les résultats
            showScanResults(scanResults);
            
            // Notification de succès
            showNotification('Scan du système terminé. Tous les systèmes fonctionnent normalement.', 'success');
        }, 3000);
    }
    
    /**
     * Affiche les résultats du scan système
     * @param {Object} results - Résultats du scan
     */
    function showScanResults(results) {
        const systemStatusItems = document.querySelectorAll('.system-status-item');
        
        systemStatusItems.forEach(item => {
            const componentType = item.getAttribute('data-component');
            const statusBadge = item.querySelector('.status-badge');
            const statusMessage = item.querySelector('.status-message');
            
            if (componentType && results.details[componentType]) {
                const componentStatus = results.details[componentType];
                
                // Mettre à jour le badge de statut
                if (statusBadge) {
                    statusBadge.className = 'status-badge';
                    statusBadge.classList.add(`status-${componentStatus.status}`);
                    statusBadge.textContent = getStatusLabel(componentStatus.status);
                }
                
                // Mettre à jour le message
                if (statusMessage) {
                    statusMessage.textContent = componentStatus.message;
                }
            }
        });
        
        // Mettre à jour la date de dernière vérification
        const lastCheckedElement = document.getElementById('lastSystemCheck');
        if (lastCheckedElement) {
            const now = new Date();
            lastCheckedElement.textContent = now.toLocaleDateString('fr-FR', { 
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }
    
    /**
     * Convertit un code de statut en libellé
     * @param {string} status - Code du statut
     * @returns {string} - Libellé du statut
     */
    function getStatusLabel(status) {
        const statusMap = {
            'optimal': 'Optimal',
            'good': 'Bon',
            'warning': 'Attention',
            'critical': 'Critique',
            'unknown': 'Inconnu'
        };
        
        return statusMap[status] || 'Inconnu';
    }
    
    /**
     * Vide le cache du système
     */
    function clearSystemCache() {
        showNotification('Nettoyage du cache démarré. Cela peut prendre quelques instants...', 'info');
        
        // Afficher l'indicateur de chargement
        showLoadingOverlay('Nettoyage du cache en cours...');
        
        // Simuler le nettoyage du cache
        setTimeout(() => {
            hideLoadingOverlay();
            
            showNotification('Le cache du système a été vidé avec succès.', 'success');
        }, 2000);
    }
    
    /**
     * Reconstruit l'index de recherche
     */
    function rebuildSearchIndex() {
        showNotification('Reconstruction de l\'index de recherche démarrée. Cela peut prendre quelques instants...', 'info');
        
        // Afficher l'indicateur de chargement
        showLoadingOverlay('Reconstruction de l\'index en cours...');
        
        // Simuler la reconstruction
        setTimeout(() => {
            hideLoadingOverlay();
            
            showNotification('L\'index de recherche a été reconstruit avec succès.', 'success');
        }, 2500);
    }
    
    /**
     * Actualise l'état du système
     */
    function refreshSystemStatus() {
        // Récupérer les éléments de statut
        const statusItems = document.querySelectorAll('.system-status-item .status-badge');
        
        // Afficher l'état de chargement
        statusItems.forEach(item => {
            item.textContent = 'Vérification...';
            item.className = 'status-badge status-loading';
        });
        
        // Simuler la récupération des données
        setTimeout(() => {
            performSystemScan();
        }, 500);
    }
    
    /**
     * Charger des notifications de démonstration
     */
    function loadDemoNotifications() {
        const notifList = document.querySelector('.notifications-list');
        if (!notifList) return;
        
        const demoNotifications = [
            {
                id: 1,
                title: 'Nouvelle inscription',
                message: 'Un nouveau joueur s\'est inscrit à la Coupe Nationale 2025',
                time: '5 minutes',
                type: 'info',
                read: false
            },
            {
                id: 2,
                title: 'Alerte de sécurité',
                message: 'Tentative de connexion depuis une nouvelle adresse IP',
                time: '1 heure',
                type: 'warning',
                read: false
            },
            {
                id: 3,
                title: 'Paiement reçu',
                message: 'Paiement confirmé pour l\'inscription au tournoi ESL Pro Series',
                time: '3 heures',
                type: 'success',
                read: true
            }
        ];
        
        // Vider la liste
        notifList.innerHTML = '';
        
        // Ajouter les notifications
        demoNotifications.forEach(notif => {
            const notifItem = document.createElement('li');
            notifItem.className = `notification-item ${notif.read ? 'read' : 'unread'}`;
            notifItem.innerHTML = `
                <div class="notification-icon notification-${notif.type}">
                    ${getNotificationIcon(notif.type)}
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notif.title}</div>
                    <div class="notification-message">${notif.message}</div>
                    <div class="notification-time">Il y a ${notif.time}</div>
                </div>
                <button class="notification-dismiss" data-id="${notif.id}" aria-label="Ignorer">×</button>
            `;
            
            notifList.appendChild(notifItem);
        });
        
        // Mettre à jour le badge
        const unreadCount = demoNotifications.filter(n => !n.read).length;
        const badge = document.querySelector('.notifications-badge');
        if (badge) {
            badge.setAttribute('data-count', unreadCount);
            badge.classList.toggle('has-notifications', unreadCount > 0);
        }
        
        // Gestionnaire pour marquer comme lu
        const dismissBtns = document.querySelectorAll('.notification-dismiss');
        dismissBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const id = parseInt(this.getAttribute('data-id'));
                const item = this.closest('.notification-item');
                
                // Animation de disparition
                item.classList.add('removing');
                setTimeout(() => {
                    item.remove();
                    
                    // Mettre à jour le compteur
                    const currentCount = parseInt(badge.getAttribute('data-count'));
                    const newCount = Math.max(0, currentCount - 1);
                    badge.setAttribute('data-count', newCount);
                    badge.classList.toggle('has-notifications', newCount > 0);
                }, 300);
            });
        });
    }
    
    /**
     * Obtient l'icône pour un type de notification
     * @param {string} type - Type de notification
     * @returns {string} - HTML de l'icône
     */
    function getNotificationIcon(type) {
        const iconMap = {
            'info': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"/></svg>',
            'success': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L369 209z"/></svg>',
            'warning': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-384c13.3 0 24 10.7 24 24V264c0 13.3-10.7 24-24 24s-24-10.7-24-24V152c0-13.3 10.7-24 24-24zm32 224a32 32 0 1 1 -64 0 32 32 0 1 1 64 0z"/></svg>',
            'error': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z"/></svg>'
        };
        
        return iconMap[type] || iconMap.info;
    }
    
    /**
     * Affiche un tooltip
     * @param {Event} e - Événement mouseover
     */
    function showTooltip(e) {
        const text = this.getAttribute('data-tooltip');
        if (!text) return;
        
        // Créer le tooltip s'il n'existe pas
        let tooltip = document.getElementById('admin-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'admin-tooltip';
            tooltip.className = 'admin-tooltip';
            document.body.appendChild(tooltip);
        }
        
        // Mettre à jour le contenu
        tooltip.textContent = text;
        
        // Positionner le tooltip
        const rect = this.getBoundingClientRect();
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - 8}px`;
        tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)}px`;
        
        // Afficher avec une animation
        tooltip.classList.add('visible');
    }
    
    /**
     * Masque le tooltip
     */
    function hideTooltip() {
        const tooltip = document.getElementById('admin-tooltip');
        if (tooltip) {
            tooltip.classList.remove('visible');
        }
    }
    
    /**
     * Affiche un overlay de chargement
     * @param {string} message - Message à afficher
     */
    function showLoadingOverlay(message) {
        // Créer l'overlay s'il n'existe pas
        if (!document.getElementById('loadingOverlay')) {
            const overlayHtml = `
                <div id="loadingOverlay" class="loading-overlay">
                    <div class="loading-spinner"></div>
                    <p id="loadingMessage" class="loading-message">Chargement en cours...</p>
                </div>
            `;
            
            const overlayContainer = document.createElement('div');
            overlayContainer.innerHTML = overlayHtml;
            document.body.appendChild(overlayContainer.firstElementChild);
        }
        
        // Mettre à jour le message et afficher
        document.getElementById('loadingMessage').textContent = message || 'Chargement en cours...';
        document.getElementById('loadingOverlay').classList.add('active');
    }
    
    /**
     * Masque l'overlay de chargement
     */
    function hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    /**
     * Crée et affiche une notification
     * @param {string} message - Message à afficher
     * @param {string} type - Type de notification (success, error, info, warning)
     */
    window.createNotification = function(message, type = 'info') {
        // Conteneur des notifications
        const container = document.getElementById('notificationsContainer');
        if (!container) return;
        
        // Créer la notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        notification.innerHTML = `
            <div class="notification-icon">${getNotificationIcon(type)}</div>
            <div class="notification-content">${message}</div>
            <button class="notification-close" aria-label="Fermer">×</button>
        `;
        
        // Ajouter au conteneur
        container.appendChild(notification);
        
        // Animation d'entrée
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Bouton de fermeture
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
        
        // Disparaître automatiquement après 5 secondes (sauf pour les erreurs)
        if (type !== 'error') {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.classList.remove('show');
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.remove();
                        }
                    }, 300);
                }
            }, 5000);
        }
    };
});
