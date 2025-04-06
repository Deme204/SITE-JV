/**
 * Module d'exportation de données - Panneau d'administration
 * Permet l'exportation des données du système dans différents formats
 */

document.addEventListener('DOMContentLoaded', function() {
    // Référence au bouton d'exportation dans le tableau de bord
    const exportDataBtn = document.querySelector('[data-action="export-data"]');
    
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', showExportModal);
    }
    
    // Créer et ajouter le modal d'exportation au DOM s'il n'existe pas déjà
    if (!document.getElementById('exportModal')) {
        createExportModal();
    }
    
    /**
     * Crée le modal d'exportation et l'ajoute au DOM
     */
    function createExportModal() {
        const modalHtml = `
            <div id="exportModal" class="modal" role="dialog" aria-labelledby="exportModalTitle" aria-hidden="true">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="exportModalTitle">Exporter les données</h3>
                        <button class="close-modal" aria-label="Fermer">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="exportForm">
                            <div class="form-group">
                                <label for="exportType">Type de données</label>
                                <select id="exportType" name="exportType" required>
                                    <option value="">Sélectionnez un type de données</option>
                                    <option value="competitions">Compétitions</option>
                                    <option value="players">Joueurs</option>
                                    <option value="results">Résultats</option>
                                    <option value="payments">Paiements</option>
                                    <option value="all">Toutes les données</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="exportFormat">Format d'exportation</label>
                                <select id="exportFormat" name="exportFormat" required>
                                    <option value="csv">CSV</option>
                                    <option value="json">JSON</option>
                                    <option value="excel">Excel</option>
                                    <option value="pdf">PDF</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="dateRangeStart">Période - Date de début</label>
                                <input type="date" id="dateRangeStart" name="dateRangeStart">
                            </div>
                            
                            <div class="form-group">
                                <label for="dateRangeEnd">Période - Date de fin</label>
                                <input type="date" id="dateRangeEnd" name="dateRangeEnd">
                            </div>
                            
                            <div class="form-group form-checkbox">
                                <input type="checkbox" id="anonymizeData" name="anonymizeData">
                                <label for="anonymizeData">Anonymiser les données personnelles</label>
                            </div>
                            
                            <div class="form-group form-checkbox">
                                <input type="checkbox" id="includeMeta" name="includeMeta" checked>
                                <label for="includeMeta">Inclure les métadonnées</label>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-tertiary" data-action="close-export-modal">Annuler</button>
                        <button type="button" class="btn btn-primary" id="startExport">Démarrer l'exportation</button>
                    </div>
                </div>
            </div>
        `;
        
        // Ajouter le modal au body
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer.firstElementChild);
        
        // Ajouter les événements
        const modal = document.getElementById('exportModal');
        const closeBtn = modal.querySelector('.close-modal');
        const cancelBtn = modal.querySelector('[data-action="close-export-modal"]');
        const startExportBtn = document.getElementById('startExport');
        
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        startExportBtn.addEventListener('click', startExportProcess);
        
        // Initialiser les dates par défaut
        const today = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(today.getMonth() - 1);
        
        document.getElementById('dateRangeEnd').valueAsDate = today;
        document.getElementById('dateRangeStart').valueAsDate = oneMonthAgo;
    }
    
    /**
     * Affiche le modal d'exportation
     */
    function showExportModal() {
        const modal = document.getElementById('exportModal');
        if (modal) {
            modal.style.display = 'block';
        }
    }
    
    /**
     * Démarre le processus d'exportation des données
     */
    function startExportProcess() {
        const form = document.getElementById('exportForm');
        
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        // Récupérer les valeurs du formulaire
        const exportType = document.getElementById('exportType').value;
        const exportFormat = document.getElementById('exportFormat').value;
        const dateStart = document.getElementById('dateRangeStart').value;
        const dateEnd = document.getElementById('dateRangeEnd').value;
        const anonymize = document.getElementById('anonymizeData').checked;
        const includeMeta = document.getElementById('includeMeta').checked;
        
        // Afficher l'indicateur de chargement
        showLoadingOverlay('Préparation de l\'exportation en cours...');
        
        // Simuler un délai pour l'exportation
        setTimeout(() => {
            // Récupérer les données à exporter (dans une vraie application, cela serait fait via une API)
            const exportData = getExportData(exportType);
            
            // Générer le fichier d'exportation selon le format demandé
            const exportFileName = generateExportFile(exportData, exportFormat, exportType, dateStart, dateEnd, anonymize, includeMeta);
            
            // Masquer l'indicateur de chargement
            hideLoadingOverlay();
            
            // Fermer le modal
            document.getElementById('exportModal').style.display = 'none';
            
            // Notification de succès
            showNotification(
                `L'exportation des données a été réalisée avec succès. Le fichier ${exportFileName} est prêt à être téléchargé.`,
                'success'
            );
            
            // Simuler un téléchargement
            simulateDownload(exportFileName);
        }, 2000);
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
     * Récupère les données à exporter
     * @param {string} type - Type de données à exporter
     * @returns {Array} - Données à exporter
     */
    function getExportData(type) {
        // Dans une vraie application, ces données viendraient d'une API
        const mockData = {
            competitions: [
                { id: 1, name: 'Coupe Nationale 2025', game: 'League of Legends', date: '2025-04-05', status: 'active' },
                { id: 2, name: 'ESL Pro Series', game: 'Counter-Strike 2', date: '2025-04-12', status: 'pending' },
                { id: 3, name: 'Tournoi Rocket League', game: 'Rocket League', date: '2025-04-15', status: 'registration_closed' }
            ],
            players: [
                { id: 1, username: 'ProGamer123', fullName: 'Jean Dupont', email: 'jean@example.com', registered: '2025-01-15' },
                { id: 2, username: 'GameMaster', fullName: 'Marie Martin', email: 'marie@example.com', registered: '2025-02-01' },
                { id: 3, username: 'EsportKing', fullName: 'Pierre Lefebvre', email: 'pierre@example.com', registered: '2025-03-10' }
            ],
            results: [
                { id: 1, competition: 'Coupe Nationale 2024', player: 'ProGamer123', position: 1, score: 128, date: '2024-12-15' },
                { id: 2, competition: 'Coupe Nationale 2024', player: 'GameMaster', position: 2, score: 112, date: '2024-12-15' },
                { id: 3, competition: 'ESL Pro Series 2024', player: 'EsportKing', position: 1, score: 87, date: '2024-11-20' }
            ],
            payments: [
                { id: 1, player: 'ProGamer123', amount: 25.00, type: 'inscription', status: 'completed', date: '2025-03-28' },
                { id: 2, player: 'GameMaster', amount: 25.00, type: 'inscription', status: 'completed', date: '2025-03-27' },
                { id: 3, player: 'EsportKing', amount: 15.00, type: 'inscription', status: 'pending', date: '2025-04-01' }
            ]
        };
        
        if (type === 'all') {
            return mockData;
        }
        
        return mockData[type] || [];
    }
    
    /**
     * Génère un fichier d'exportation
     * @param {Array} data - Données à exporter
     * @param {string} format - Format du fichier
     * @param {string} type - Type de données
     * @param {string} dateStart - Date de début
     * @param {string} dateEnd - Date de fin
     * @param {boolean} anonymize - Anonymiser les données personnelles
     * @param {boolean} includeMeta - Inclure les métadonnées
     * @returns {string} - Nom du fichier généré
     */
    function generateExportFile(data, format, type, dateStart, dateEnd, anonymize, includeMeta) {
        // Dans une vraie application, cela générerait un vrai fichier
        // Ici, on se contente de renvoyer un nom de fichier
        
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
        const typeLabel = getTypeLabel(type);
        
        return `export_${typeLabel}_${timestamp}.${format}`;
    }
    
    /**
     * Obtient le libellé d'un type de données
     * @param {string} type - Type de données
     * @returns {string} - Libellé
     */
    function getTypeLabel(type) {
        const typeMap = {
            'competitions': 'competitions',
            'players': 'joueurs',
            'results': 'resultats',
            'payments': 'paiements',
            'all': 'toutes_donnees'
        };
        
        return typeMap[type] || type;
    }
    
    /**
     * Simule le téléchargement d'un fichier
     * @param {string} fileName - Nom du fichier
     */
    function simulateDownload(fileName) {
        console.log(`Téléchargement simulé du fichier: ${fileName}`);
        
        // Dans une vraie application, cela déclencherait un vrai téléchargement
        // Ici, on va juste créer un lien temporaire dans l'interface
        
        const downloadLink = document.createElement('div');
        downloadLink.classList.add('download-notification');
        downloadLink.innerHTML = `
            <div class="download-notification-content">
                <div class="download-icon">📥</div>
                <div class="download-details">
                    <div class="download-title">Fichier prêt à télécharger</div>
                    <div class="download-filename">${fileName}</div>
                </div>
                <button class="download-button">Télécharger</button>
            </div>
        `;
        
        document.body.appendChild(downloadLink);
        
        // Ajouter l'animation d'entrée
        setTimeout(() => {
            downloadLink.classList.add('show');
        }, 10);
        
        // Supprimer après un certain délai
        setTimeout(() => {
            downloadLink.classList.remove('show');
            downloadLink.classList.add('hide');
            
            setTimeout(() => {
                downloadLink.remove();
            }, 300);
        }, 10000);
        
        // Gérer le clic sur le bouton de téléchargement
        downloadLink.querySelector('.download-button').addEventListener('click', function() {
            alert(`Téléchargement du fichier ${fileName} démarré.\n\nRemarque: Dans une vraie application, cela déclencherait un vrai téléchargement de fichier.`);
            
            downloadLink.classList.remove('show');
            downloadLink.classList.add('hide');
            setTimeout(() => {
                downloadLink.remove();
            }, 300);
        });
    }
    
    /**
     * Affiche une notification à l'utilisateur
     * @param {string} message - Message à afficher
     * @param {string} type - Type de notification (success, error, info, warning)
     */
    function showNotification(message, type = 'info') {
        // Utiliser la fonction createNotification définie dans le fichier principal
        if (typeof createNotification === 'function') {
            createNotification(message, type);
        } else {
            // Fallback si la fonction n'est pas disponible
            alert(message);
        }
    }
})();
