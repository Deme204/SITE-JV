/**
 * Module d'état du système - Panneau d'administration
 * Surveille et affiche l'état des différents composants du système
 */

document.addEventListener('DOMContentLoaded', function() {
    // Références aux éléments du DOM
    const systemSection = document.getElementById('systemSection');
    const refreshStatusBtn = document.getElementById('refreshSystemStatus');
    const systemComponents = [
        { id: 'database', name: 'Base de données', description: 'État de la connexion et des performances de la base de données' },
        { id: 'api', name: 'API', description: 'Disponibilité et performance des endpoints API' },
        { id: 'fileSystem', name: 'Système de fichiers', description: 'Espace disque et permissions' },
        { id: 'cache', name: 'Cache', description: 'État du cache et efficacité' },
        { id: 'security', name: 'Sécurité', description: 'Vérifications de sécurité et détection d\'intrusion' },
        { id: 'performance', name: 'Performance', description: 'Temps de réponse et utilisation des ressources' },
        { id: 'integrations', name: 'Intégrations', description: 'État des services tiers connectés' }
    ];
    
    // Initialisation
    function init() {
        // Créer la section d'état du système si elle n'existe pas
        if (systemSection && !document.querySelector('.system-status-grid')) {
            createSystemStatusUI();
        }
        
        // Ajouter les événements
        if (refreshStatusBtn) {
            refreshStatusBtn.addEventListener('click', refreshSystemStatus);
        }
        
        // Charger les données initiales
        refreshSystemStatus();
    }
    
    /**
     * Crée l'interface d'état du système
     */
    function createSystemStatusUI() {
        // Conteneur principal
        const statusContainer = document.createElement('div');
        statusContainer.className = 'system-status-container';
        
        // En-tête avec statistiques globales
        const statusHeader = document.createElement('div');
        statusHeader.className = 'system-status-header';
        statusHeader.innerHTML = `
            <div class="system-status-overview">
                <div class="system-stat">
                    <span class="stat-label">Disponibilité du serveur</span>
                    <span class="stat-value" id="serverUptime">Chargement...</span>
                </div>
                <div class="system-stat">
                    <span class="stat-label">Charge CPU</span>
                    <span class="stat-value" id="cpuLoad">Chargement...</span>
                </div>
                <div class="system-stat">
                    <span class="stat-label">Utilisation mémoire</span>
                    <span class="stat-value" id="memoryUsage">Chargement...</span>
                </div>
                <div class="system-stat">
                    <span class="stat-label">Dernière vérification</span>
                    <span class="stat-value" id="lastSystemCheck">Jamais</span>
                </div>
            </div>
            <div class="system-actions">
                <button id="refreshSystemStatus" class="btn btn-primary">
                    <span class="btn-icon">↻</span> Actualiser
                </button>
            </div>
        `;
        
        // Grille des composants du système
        const statusGrid = document.createElement('div');
        statusGrid.className = 'system-status-grid';
        
        // Ajouter les composants du système
        systemComponents.forEach(component => {
            const componentCard = document.createElement('div');
            componentCard.className = 'system-status-item';
            componentCard.setAttribute('data-component', component.id);
            
            componentCard.innerHTML = `
                <div class="status-item-header">
                    <h4 class="status-title">${component.name}</h4>
                    <span class="status-badge status-loading">Vérification...</span>
                </div>
                <p class="status-description">${component.description}</p>
                <p class="status-message">Vérification de l'état du composant...</p>
                <div class="status-details" id="${component.id}Details"></div>
            `;
            
            statusGrid.appendChild(componentCard);
        });
        
        // Ajouter les journaux système
        const systemLogs = document.createElement('div');
        systemLogs.className = 'system-logs-container';
        systemLogs.innerHTML = `
            <div class="system-logs-header">
                <h3>Journaux système</h3>
                <div class="logs-filter">
                    <select id="logTypeFilter">
                        <option value="all">Tous les journaux</option>
                        <option value="error">Erreurs</option>
                        <option value="warning">Avertissements</option>
                        <option value="info">Informations</option>
                    </select>
                </div>
            </div>
            <div class="system-logs" id="systemLogs">
                <div class="loading-indicator">Chargement des journaux...</div>
            </div>
        `;
        
        // Assembler les éléments
        statusContainer.appendChild(statusHeader);
        statusContainer.appendChild(statusGrid);
        statusContainer.appendChild(systemLogs);
        
        // Ajouter à la section système
        systemSection.appendChild(statusContainer);
        
        // Ajouter l'événement de filtre des journaux
        const logFilter = document.getElementById('logTypeFilter');
        if (logFilter) {
            logFilter.addEventListener('change', filterSystemLogs);
        }
    }
    
    /**
     * Actualise l'état du système
     */
    function refreshSystemStatus() {
        // Mettre à jour l'état de chargement
        const statusBadges = document.querySelectorAll('.status-badge');
        statusBadges.forEach(badge => {
            badge.className = 'status-badge status-loading';
            badge.textContent = 'Vérification...';
        });
        
        // Mettre à jour les statistiques globales
        document.getElementById('serverUptime').innerHTML = '<div class="skeleton-loader"></div>';
        document.getElementById('cpuLoad').innerHTML = '<div class="skeleton-loader"></div>';
        document.getElementById('memoryUsage').innerHTML = '<div class="skeleton-loader"></div>';
        
        // Simuler une requête API
        setTimeout(() => {
            // Données simulées (viendraient d'une API dans une vraie application)
            const systemStatus = {
                server: {
                    uptime: '99.98%',
                    uptimeDays: 45,
                    cpuLoad: '23%',
                    memoryUsage: '1.8 GB / 8 GB',
                    lastCheck: new Date().toLocaleString('fr-FR')
                },
                components: {
                    database: {
                        status: 'optimal',
                        message: 'La base de données fonctionne normalement.',
                        details: {
                            connections: 12,
                            activeQueries: 3,
                            avgResponseTime: '45ms'
                        }
                    },
                    api: {
                        status: 'optimal',
                        message: 'Tous les endpoints API sont disponibles.',
                        details: {
                            activeRequests: 8,
                            avgResponseTime: '120ms',
                            errorRate: '0%'
                        }
                    },
                    fileSystem: {
                        status: 'good',
                        message: 'Espace disque disponible : 78%',
                        details: {
                            totalSpace: '500 GB',
                            usedSpace: '110 GB',
                            freeSpace: '390 GB'
                        }
                    },
                    cache: {
                        status: 'optimal',
                        message: 'Le cache fonctionne efficacement.',
                        details: {
                            hitRatio: '94%',
                            items: 1267,
                            size: '24 MB'
                        }
                    },
                    security: {
                        status: 'optimal',
                        message: 'Aucun problème de sécurité détecté.',
                        details: {
                            lastScan: 'Aujourd\'hui à 12:30',
                            vulnerabilities: '0',
                            blockedAttempts: '3'
                        }
                    },
                    performance: {
                        status: 'good',
                        message: 'Les performances sont bonnes.',
                        details: {
                            avgPageLoad: '1.2s',
                            avgApiResponse: '85ms',
                            bottlenecks: '0'
                        }
                    },
                    integrations: {
                        status: 'warning',
                        message: 'L\'API de paiement présente des ralentissements.',
                        details: {
                            totalIntegrations: 5,
                            activeIntegrations: 5,
                            issuesDetected: 1
                        }
                    }
                },
                logs: getSystemLogs()
            };
            
            // Mettre à jour l'interface
            updateSystemStatusUI(systemStatus);
        }, 1500);
    }
    
    /**
     * Met à jour l'interface avec les données d'état
     * @param {Object} data - Données d'état du système
     */
    function updateSystemStatusUI(data) {
        // Mettre à jour les statistiques globales
        document.getElementById('serverUptime').textContent = data.server.uptime;
        document.getElementById('cpuLoad').textContent = data.server.cpuLoad;
        document.getElementById('memoryUsage').textContent = data.server.memoryUsage;
        document.getElementById('lastSystemCheck').textContent = data.server.lastCheck;
        
        // Mettre à jour les composants
        Object.keys(data.components).forEach(componentId => {
            const component = data.components[componentId];
            const componentElement = document.querySelector(`.system-status-item[data-component="${componentId}"]`);
            
            if (componentElement) {
                // Mettre à jour le badge
                const badge = componentElement.querySelector('.status-badge');
                if (badge) {
                    badge.className = `status-badge status-${component.status}`;
                    badge.textContent = getStatusLabel(component.status);
                }
                
                // Mettre à jour le message
                const message = componentElement.querySelector('.status-message');
                if (message) {
                    message.textContent = component.message;
                }
                
                // Mettre à jour les détails
                const details = componentElement.querySelector('.status-details');
                if (details && component.details) {
                    details.innerHTML = '';
                    
                    // Créer une liste de détails
                    const detailsList = document.createElement('ul');
                    detailsList.className = 'status-details-list';
                    
                    Object.keys(component.details).forEach(key => {
                        const item = document.createElement('li');
                        item.innerHTML = `<span class="detail-label">${formatDetailLabel(key)}:</span> <span class="detail-value">${component.details[key]}</span>`;
                        detailsList.appendChild(item);
                    });
                    
                    details.appendChild(detailsList);
                }
            }
        });
        
        // Mettre à jour les journaux
        updateSystemLogs(data.logs);
    }
    
    /**
     * Met à jour les journaux système
     * @param {Array} logs - Liste des journaux
     */
    function updateSystemLogs(logs) {
        const logsContainer = document.getElementById('systemLogs');
        if (!logsContainer) return;
        
        // Vider le conteneur
        logsContainer.innerHTML = '';
        
        // Ajouter les journaux
        if (logs.length === 0) {
            logsContainer.innerHTML = '<p class="empty-logs">Aucun journal système disponible.</p>';
            return;
        }
        
        const logsList = document.createElement('ul');
        logsList.className = 'logs-list';
        
        logs.forEach(log => {
            const logItem = document.createElement('li');
            logItem.className = `log-item log-${log.level}`;
            logItem.innerHTML = `
                <span class="log-time">${log.time}</span>
                <span class="log-level">${log.level}</span>
                <span class="log-component">[${log.component}]</span>
                <span class="log-message">${log.message}</span>
            `;
            
            logsList.appendChild(logItem);
        });
        
        logsContainer.appendChild(logsList);
    }
    
    /**
     * Filtre les journaux système
     */
    function filterSystemLogs() {
        const filter = document.getElementById('logTypeFilter').value;
        const logItems = document.querySelectorAll('.log-item');
        
        logItems.forEach(item => {
            if (filter === 'all' || item.classList.contains(`log-${filter}`)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    /**
     * Récupère les journaux système simulés
     * @returns {Array} - Liste des journaux
     */
    function getSystemLogs() {
        // Dans une vraie application, ces données viendraient d'une API
        return [
            { time: '04/04/2025 00:25:12', level: 'info', component: 'Auth', message: 'Connexion réussie pour l\'administrateur admin@esport.com' },
            { time: '04/04/2025 00:15:08', level: 'warning', component: 'API', message: 'Ralentissement détecté sur l\'API de paiement' },
            { time: '03/04/2025 23:50:31', level: 'info', component: 'Systeme', message: 'Sauvegarde automatique démarrée' },
            { time: '03/04/2025 23:50:45', level: 'info', component: 'Systeme', message: 'Sauvegarde terminée avec succès' },
            { time: '03/04/2025 22:12:06', level: 'error', component: 'Database', message: 'Erreur de connexion temporaire - Tentative de reconnexion réussie' },
            { time: '03/04/2025 21:45:20', level: 'info', component: 'Compétition', message: 'Nouvelle compétition créée: Tournoi Rocket League' },
            { time: '03/04/2025 21:30:18', level: 'info', component: 'Utilisateur', message: 'Nouvel utilisateur enregistré: GameMaster' },
            { time: '03/04/2025 20:15:02', level: 'warning', component: 'Sécurité', message: 'Tentative de connexion échouée depuis l\'IP 203.0.113.42' },
            { time: '03/04/2025 19:10:47', level: 'info', component: 'Paiement', message: 'Paiement reçu pour l\'inscription #1024' },
            { time: '03/04/2025 18:05:30', level: 'info', component: 'Cache', message: 'Purge automatique du cache terminée' }
        ];
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
     * Formate un libellé de détail
     * @param {string} key - Clé du détail
     * @returns {string} - Libellé formaté
     */
    function formatDetailLabel(key) {
        const labelMap = {
            'connections': 'Connexions',
            'activeQueries': 'Requêtes actives',
            'avgResponseTime': 'Temps de réponse moyen',
            'activeRequests': 'Requêtes actives',
            'errorRate': 'Taux d\'erreur',
            'totalSpace': 'Espace total',
            'usedSpace': 'Espace utilisé',
            'freeSpace': 'Espace libre',
            'hitRatio': 'Ratio de cache',
            'items': 'Éléments',
            'size': 'Taille',
            'lastScan': 'Dernier scan',
            'vulnerabilities': 'Vulnérabilités',
            'blockedAttempts': 'Tentatives bloquées',
            'avgPageLoad': 'Chargement de page moyen',
            'avgApiResponse': 'Réponse API moyenne',
            'bottlenecks': 'Goulots d\'étranglement',
            'totalIntegrations': 'Intégrations totales',
            'activeIntegrations': 'Intégrations actives',
            'issuesDetected': 'Problèmes détectés'
        };
        
        // Si la clé n'existe pas dans le mapping, la formater manuellement
        if (!labelMap[key]) {
            return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
        }
        
        return labelMap[key];
    }
    
    // Initialiser le module
    init();
})();
