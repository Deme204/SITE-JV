/**
 * Gestion des compétitions - Panneau d'administration
 * Fonctionnalités pour créer, modifier et gérer les compétitions
 */

document.addEventListener('DOMContentLoaded', function() {
    // Référence aux éléments du DOM
    const addCompetitionBtn = document.getElementById('btnAddCompetition');
    const competitionModal = document.getElementById('competitionModal');
    const competitionForm = document.getElementById('competitionForm');
    const saveCompetitionBtn = document.getElementById('saveCompetition');
    const searchCompetitionInput = document.getElementById('searchCompetition');
    const competitionTable = document.querySelector('.admin-table tbody');
    const selectAllCheckbox = document.getElementById('selectAllCompetitions');
    
    // Bouton "Nouvelle compétition" dans le tableau de bord
    const dashboardNewCompBtn = document.querySelector('[data-action="new-competition"]');

    // Configuration initiale
    let competitions = [
        {
            id: 1,
            name: 'Coupe Nationale 2025',
            game: 'League of Legends',
            date: '2025-04-05',
            time: '14:00',
            participants: { current: 48, max: 64 },
            status: 'active',
            description: 'Championnat national de League of Legends',
            price: 15,
            format: 'elimination'
        },
        {
            id: 2,
            name: 'ESL Pro Series',
            game: 'Counter-Strike 2',
            date: '2025-04-12',
            time: '18:00',
            participants: { current: 32, max: 32 },
            status: 'pending',
            description: 'Tournoi professionnel Counter-Strike 2',
            price: 25,
            format: 'poules'
        },
        {
            id: 3,
            name: 'Tournoi Rocket League',
            game: 'Rocket League',
            date: '2025-04-15',
            time: '20:00',
            participants: { current: 24, max: 24 },
            status: 'registration_closed',
            description: 'Tournoi amical de Rocket League 3v3',
            price: 10,
            format: 'suisse'
        }
    ];
    
    let nextId = 4; // ID pour la prochaine compétition
    
    /**
     * Initialisation et événements
     */
    function init() {
        // Événements du modal de compétition
        if (addCompetitionBtn) {
            addCompetitionBtn.addEventListener('click', openCompetitionModal);
        }
        
        if (dashboardNewCompBtn) {
            dashboardNewCompBtn.addEventListener('click', openCompetitionModal);
        }
        
        if (saveCompetitionBtn) {
            saveCompetitionBtn.addEventListener('click', saveCompetition);
        }
        
        // Recherche de compétitions
        if (searchCompetitionInput) {
            searchCompetitionInput.addEventListener('input', searchCompetitions);
        }
        
        // Sélection de toutes les compétitions
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', toggleSelectAll);
        }
        
        // Charger les compétitions initiales
        renderCompetitions();
        
        // Gérer les événements dynamiques (boutons d'action)
        if (competitionTable) {
            competitionTable.addEventListener('click', handleTableActions);
        }
    }
    
    /**
     * Ouvre le modal pour ajouter une nouvelle compétition
     */
    function openCompetitionModal() {
        // Réinitialiser le formulaire
        competitionForm.reset();
        
        // Définir les valeurs par défaut
        document.getElementById('compDate').valueAsDate = new Date();
        document.getElementById('compMaxJoueurs').value = 32;
        
        // Titre du modal
        document.getElementById('modalTitle').textContent = 'Ajouter une compétition';
        
        // Afficher le modal
        competitionModal.style.display = 'block';
        
        // Focus sur le premier champ
        document.getElementById('compNom').focus();
    }
    
    /**
     * Ouvre le modal pour modifier une compétition existante
     * @param {number} id - ID de la compétition à modifier
     */
    function openEditModal(id) {
        const competition = competitions.find(comp => comp.id === id);
        if (!competition) return;
        
        // Remplir le formulaire avec les données de la compétition
        document.getElementById('compNom').value = competition.name;
        document.getElementById('compJeu').value = getGameValue(competition.game);
        document.getElementById('compDate').value = competition.date;
        document.getElementById('compHeure').value = competition.time;
        document.getElementById('compMaxJoueurs').value = competition.participants.max;
        document.getElementById('compFormat').value = competition.format;
        document.getElementById('compDescription').value = competition.description || '';
        document.getElementById('compPrix').value = competition.price;
        
        // Statut de publication
        document.getElementById('compPublie').checked = competition.status === 'active';
        
        // Mettre à jour le titre du modal
        document.getElementById('modalTitle').textContent = 'Modifier la compétition';
        
        // Stocker l'ID de la compétition dans le formulaire
        competitionForm.dataset.editId = id;
        
        // Afficher le modal
        competitionModal.style.display = 'block';
    }
    
    /**
     * Enregistre la compétition (ajout ou modification)
     */
    function saveCompetition() {
        if (!competitionForm.checkValidity()) {
            competitionForm.reportValidity();
            return;
        }
        
        // Récupérer les données du formulaire
        const formData = {
            name: document.getElementById('compNom').value,
            game: getGameLabel(document.getElementById('compJeu').value),
            date: document.getElementById('compDate').value,
            time: document.getElementById('compHeure').value,
            participants: {
                current: 0,
                max: parseInt(document.getElementById('compMaxJoueurs').value)
            },
            format: document.getElementById('compFormat').value,
            description: document.getElementById('compDescription').value,
            price: parseFloat(document.getElementById('compPrix').value) || 0,
            status: document.getElementById('compPublie').checked ? 'active' : 'draft'
        };
        
        // Vérifier s'il s'agit d'une modification ou d'un ajout
        const editId = competitionForm.dataset.editId;
        if (editId) {
            // Modification d'une compétition existante
            const index = competitions.findIndex(comp => comp.id === parseInt(editId));
            if (index !== -1) {
                // Conserver le nombre actuel de participants
                formData.participants.current = competitions[index].participants.current;
                
                // Mettre à jour la compétition
                competitions[index] = { ...competitions[index], ...formData };
                
                showNotification('Compétition mise à jour avec succès', 'success');
            }
        } else {
            // Ajout d'une nouvelle compétition
            const newCompetition = {
                id: nextId++,
                ...formData
            };
            
            competitions.push(newCompetition);
            showNotification('Nouvelle compétition créée avec succès', 'success');
        }
        
        // Fermer le modal et rafraîchir l'affichage
        competitionModal.style.display = 'none';
        competitionForm.removeAttribute('data-edit-id');
        renderCompetitions();
    }
    
    /**
     * Affiche la liste des compétitions dans le tableau
     */
    function renderCompetitions() {
        if (!competitionTable) return;
        
        // Vider le tableau
        competitionTable.innerHTML = '';
        
        // Ajouter chaque compétition
        competitions.forEach(comp => {
            const statusBadge = getStatusBadge(comp.status);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" name="selectCompetition" value="${comp.id}"></td>
                <td>${comp.name}</td>
                <td>${comp.game}</td>
                <td>${formatDate(comp.date)}</td>
                <td>${comp.participants.current}/${comp.participants.max}</td>
                <td>${statusBadge}</td>
                <td class="actions-cell">
                    <button class="btn-icon edit-btn" data-id="${comp.id}" aria-label="Modifier" title="Modifier">✎</button>
                    <button class="btn-icon delete-btn" data-id="${comp.id}" aria-label="Supprimer" title="Supprimer">❌</button>
                    <button class="btn-icon view-btn" data-id="${comp.id}" aria-label="Voir détails" title="Voir détails">👁️</button>
                </td>
            `;
            
            competitionTable.appendChild(row);
        });
        
        // Mettre à jour la pagination
        updatePagination();
    }
    
    /**
     * Gère les actions sur les boutons du tableau
     * @param {Event} e - Événement du clic
     */
    function handleTableActions(e) {
        // Identifier le bouton cliqué et l'ID de la compétition
        const targetBtn = e.target.closest('button');
        if (!targetBtn) return;
        
        const competitionId = parseInt(targetBtn.dataset.id);
        
        // Déterminer l'action à effectuer
        if (targetBtn.classList.contains('edit-btn')) {
            openEditModal(competitionId);
        } else if (targetBtn.classList.contains('delete-btn')) {
            confirmDeleteCompetition(competitionId);
        } else if (targetBtn.classList.contains('view-btn')) {
            viewCompetitionDetails(competitionId);
        }
    }
    
    /**
     * Affiche une confirmation avant de supprimer une compétition
     * @param {number} id - ID de la compétition
     */
    function confirmDeleteCompetition(id) {
        const competition = competitions.find(comp => comp.id === id);
        if (!competition) return;
        
        if (confirm(`Êtes-vous sûr de vouloir supprimer la compétition "${competition.name}" ?`)) {
            // Supprimer la compétition
            competitions = competitions.filter(comp => comp.id !== id);
            renderCompetitions();
            showNotification('Compétition supprimée avec succès', 'info');
        }
    }
    
    /**
     * Affiche les détails d'une compétition
     * @param {number} id - ID de la compétition
     */
    function viewCompetitionDetails(id) {
        const competition = competitions.find(comp => comp.id === id);
        if (!competition) return;
        
        // Simulation d'affichage des détails (dans une vraie application, cela pourrait être un autre modal ou une page)
        alert(`
            Détails de la compétition "${competition.name}"
            
            Jeu: ${competition.game}
            Date: ${formatDate(competition.date)}
            Heure: ${competition.time}
            Format: ${getFormatLabel(competition.format)}
            Participants: ${competition.participants.current}/${competition.participants.max}
            Prix d'inscription: ${competition.price}€
            Statut: ${getStatusLabel(competition.status)}
            
            Description: ${competition.description || 'Pas de description disponible'}
        `);
    }
    
    /**
     * Recherche dans les compétitions
     */
    function searchCompetitions() {
        const searchTerm = searchCompetitionInput.value.toLowerCase();
        
        if (searchTerm === '') {
            renderCompetitions();
            return;
        }
        
        // Filtrer les compétitions selon le terme de recherche
        const filteredCompetitions = competitions.filter(comp => 
            comp.name.toLowerCase().includes(searchTerm) || 
            comp.game.toLowerCase().includes(searchTerm) ||
            getStatusLabel(comp.status).toLowerCase().includes(searchTerm)
        );
        
        // Remplacer temporairement la liste et afficher
        const originalCompetitions = competitions;
        competitions = filteredCompetitions;
        renderCompetitions();
        competitions = originalCompetitions;
    }
    
    /**
     * Gère la sélection/désélection de toutes les compétitions
     */
    function toggleSelectAll() {
        const checkboxes = document.querySelectorAll('input[name="selectCompetition"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });
    }
    
    /**
     * Met à jour l'affichage de la pagination
     */
    function updatePagination() {
        const paginationInfo = document.querySelector('.pagination-info');
        if (paginationInfo) {
            paginationInfo.textContent = `Affichage de 1-${competitions.length} sur ${competitions.length} compétitions`;
        }
    }
    
    // Fonctions utilitaires
    
    /**
     * Retourne le badge HTML pour un statut donné
     * @param {string} status - Code du statut
     * @returns {string} - HTML du badge
     */
    function getStatusBadge(status) {
        const statusMap = {
            'active': '<span class="badge badge-success">Active</span>',
            'pending': '<span class="badge badge-warning">En attente</span>',
            'registration_closed': '<span class="badge badge-info">Inscription terminée</span>',
            'completed': '<span class="badge badge-secondary">Terminée</span>',
            'cancelled': '<span class="badge badge-danger">Annulée</span>',
            'draft': '<span class="badge badge-light">Brouillon</span>'
        };
        
        return statusMap[status] || `<span class="badge">${status}</span>`;
    }
    
    /**
     * Retourne le libellé d'un statut
     * @param {string} status - Code du statut
     * @returns {string} - Libellé
     */
    function getStatusLabel(status) {
        const statusMap = {
            'active': 'Active',
            'pending': 'En attente',
            'registration_closed': 'Inscription terminée',
            'completed': 'Terminée',
            'cancelled': 'Annulée',
            'draft': 'Brouillon'
        };
        
        return statusMap[status] || status;
    }
    
    /**
     * Converti une date ISO en format FR
     * @param {string} dateStr - Date au format ISO
     * @returns {string} - Date formatée
     */
    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR');
    }
    
    /**
     * Retourne la valeur du jeu pour le select
     * @param {string} gameName - Nom du jeu
     * @returns {string} - Valeur pour le select
     */
    function getGameValue(gameName) {
        const gameMap = {
            'League of Legends': 'lol',
            'Counter-Strike 2': 'cs2',
            'Valorant': 'valorant',
            'Rocket League': 'rl',
            'EA Sports FC 25': 'fifa',
            'Fortnite': 'fortnite'
        };
        
        return gameMap[gameName] || '';
    }
    
    /**
     * Retourne le nom complet du jeu à partir de la valeur du select
     * @param {string} value - Valeur du select
     * @returns {string} - Nom du jeu
     */
    function getGameLabel(value) {
        const gameMap = {
            'lol': 'League of Legends',
            'cs2': 'Counter-Strike 2',
            'valorant': 'Valorant',
            'rl': 'Rocket League',
            'fifa': 'EA Sports FC 25',
            'fortnite': 'Fortnite'
        };
        
        return gameMap[value] || value;
    }
    
    /**
     * Retourne le libellé d'un format de tournoi
     * @param {string} format - Code du format
     * @returns {string} - Libellé
     */
    function getFormatLabel(format) {
        const formatMap = {
            'elimination': 'Élimination directe',
            'poules': 'Poules + playoffs',
            'suisse': 'Système suisse',
            'roundrobin': 'Toutes rondes'
        };
        
        return formatMap[format] || format;
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
    
    // Initialiser le module
    init();
    
    // API publique du module
    return {
        openCompetitionModal,
        refreshCompetitions: renderCompetitions,
        getAllCompetitions: () => [...competitions]
    };
})();
