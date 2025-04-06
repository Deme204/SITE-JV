/**
 * Application JavaScript principale pour le site de compétition e-sport
 * Optimisée pour les performances et l'accessibilité
 */

(function() {
    'use strict';

    // Attendre que le DOM soit chargé
    document.addEventListener('DOMContentLoaded', init);

    // Variables globales
    let mobileMenuButton;
    let mainMenu;
    
    /**
     * Initialisation de l'application
     */
    function init() {
        // Initialisation du menu mobile
        initMobileMenu();
        
        // Initialisation des formulaires
        initForms();
        
        // Animation des cartes de compétition
        initCompetitionCards();
        
        // Initialisation des alertes fermables
        initAlerts();
        
        // Détection des événements de scroll pour les animations
        initScrollEffects();
        
        // Gestion du cache pour les performances
        initCaching();
        
        // Initialisation du lazy loading des images
        initLazyLoading();
        
        console.log('Application e-sport initialisée avec succès');
    }

    /**
     * Initialisation du menu mobile avec accessibilité
     */
    function initMobileMenu() {
        mobileMenuButton = document.querySelector('.mobile-menu-toggle');
        mainMenu = document.getElementById('main-menu');
        
        if (!mobileMenuButton || !mainMenu) return;
        
        mobileMenuButton.addEventListener('click', function() {
            // Toggle du menu
            const expanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !expanded);
            mainMenu.classList.toggle('active');
            document.body.classList.toggle('menu-open');
            
            // Changer le texte du bouton pour l'accessibilité
            this.setAttribute('aria-label', expanded ? 'Ouvrir le menu' : 'Fermer le menu');
        });
        
        // Gestion des sous-menus pour l'accessibilité
        const subMenuButtons = document.querySelectorAll('.has-submenu > a');
        
        subMenuButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                if (window.innerWidth < 768) {
                    e.preventDefault();
                    const parent = this.parentNode;
                    const subMenu = parent.querySelector('.submenu');
                    
                    if (subMenu) {
                        const expanded = this.getAttribute('aria-expanded') === 'true';
                        this.setAttribute('aria-expanded', !expanded);
                        subMenu.classList.toggle('active');
                    }
                }
            });
        });
        
        // Fermer le menu lorsque l'utilisateur clique en dehors
        document.addEventListener('click', function(e) {
            if (mainMenu.classList.contains('active') && 
                !mainMenu.contains(e.target) && 
                !mobileMenuButton.contains(e.target)) {
                mainMenu.classList.remove('active');
                mobileMenuButton.setAttribute('aria-expanded', 'false');
                document.body.classList.remove('menu-open');
            }
        });
    }

    /**
     * Initialisation et validation des formulaires
     */
    function initForms() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            // Formulaire de newsletter dans le footer
            if (form.classList.contains('newsletter-form')) {
                form.addEventListener('submit', function(e) {
                    e.preventDefault();
                    const emailInput = this.querySelector('input[type="email"]');
                    
                    if (emailInput && validateEmail(emailInput.value)) {
                        // Simulation d'envoi AJAX
                        showMessage(this, 'Merci de votre inscription à la newsletter!', 'success');
                        this.reset();
                    } else {
                        showMessage(this, 'Veuillez entrer une adresse email valide.', 'error');
                    }
                });
            }
            
            // Autres formulaires - préventif pour les futures implémentations
            form.querySelectorAll('input, select, textarea').forEach(field => {
                // Validation en temps réel pour l'accessibilité
                field.addEventListener('blur', function() {
                    validateField(this);
                });
            });
        });
    }

    /**
     * Validation d'un champ de formulaire
     */
    function validateField(field) {
        if (field.hasAttribute('required') && !field.value.trim()) {
            field.classList.add('is-invalid');
            field.setAttribute('aria-invalid', 'true');
            
            // Trouver ou créer un message d'erreur
            let errorMessage = field.nextElementSibling;
            if (!errorMessage || !errorMessage.classList.contains('error-message')) {
                errorMessage = document.createElement('div');
                errorMessage.className = 'error-message';
                errorMessage.id = `${field.id}-error`;
                field.parentNode.insertBefore(errorMessage, field.nextSibling);
                field.setAttribute('aria-describedby', errorMessage.id);
            }
            
            errorMessage.textContent = 'Ce champ est requis.';
            return false;
        }
        
        // Validation d'email
        if (field.type === 'email' && field.value.trim() && !validateEmail(field.value)) {
            field.classList.add('is-invalid');
            field.setAttribute('aria-invalid', 'true');
            
            let errorMessage = field.nextElementSibling;
            if (!errorMessage || !errorMessage.classList.contains('error-message')) {
                errorMessage = document.createElement('div');
                errorMessage.className = 'error-message';
                errorMessage.id = `${field.id}-error`;
                field.parentNode.insertBefore(errorMessage, field.nextSibling);
                field.setAttribute('aria-describedby', errorMessage.id);
            }
            
            errorMessage.textContent = 'Veuillez entrer une adresse email valide.';
            return false;
        }
        
        // Champ valide
        field.classList.remove('is-invalid');
        field.setAttribute('aria-invalid', 'false');
        
        const errorMessage = field.nextElementSibling;
        if (errorMessage && errorMessage.classList.contains('error-message')) {
            errorMessage.textContent = '';
        }
        
        return true;
    }

    /**
     * Validation d'email avec regex
     */
    function validateEmail(email) {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }

    /**
     * Affiche un message de succès ou d'erreur
     */
    function showMessage(element, message, type) {
        let messageElement = element.querySelector('.form-message');
        
        if (!messageElement) {
            messageElement = document.createElement('div');
            messageElement.className = 'form-message';
            element.appendChild(messageElement);
        }
        
        messageElement.textContent = message;
        messageElement.className = `form-message ${type}`;
        messageElement.setAttribute('role', 'alert');
        
        // Enlever le message après un délai
        setTimeout(() => {
            messageElement.classList.add('fade-out');
            setTimeout(() => {
                messageElement.textContent = '';
                messageElement.className = 'form-message';
                messageElement.removeAttribute('role');
            }, 500);
        }, 3000);
    }

    /**
     * Animation des cartes de compétition
     */
    function initCompetitionCards() {
        const cards = document.querySelectorAll('.competition-card');
        
        cards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.classList.add('hover');
            });
            
            card.addEventListener('mouseleave', function() {
                this.classList.remove('hover');
            });
            
            // Accessibilité au clavier
            card.addEventListener('focusin', function() {
                this.classList.add('hover');
            });
            
            card.addEventListener('focusout', function() {
                this.classList.remove('hover');
            });
        });
    }

    /**
     * Initialisation des alertes fermables
     */
    function initAlerts() {
        const alerts = document.querySelectorAll('.alert');
        
        alerts.forEach(alert => {
            // Ne faire que si l'alerte n'a pas déjà un bouton de fermeture
            if (!alert.querySelector('.alert-close')) {
                const closeButton = document.createElement('button');
                closeButton.className = 'alert-close';
                closeButton.setAttribute('aria-label', 'Fermer');
                closeButton.innerHTML = '&times;';
                
                closeButton.addEventListener('click', function() {
                    alert.classList.add('fade-out');
                    setTimeout(() => {
                        alert.style.display = 'none';
                    }, 300);
                });
                
                alert.appendChild(closeButton);
            }
        });
    }

    /**
     * Animations au défilement
     */
    function initScrollEffects() {
        // Éléments à animer au scroll
        const animatedElements = document.querySelectorAll('.animate-on-scroll');
        
        if (animatedElements.length === 0) return;
        
        // Observer pour détecter quand les éléments deviennent visibles
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-visible');
                    // Optionnel: arrêter d'observer l'élément une fois qu'il est animé
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1 // Déclencher quand 10% de l'élément est visible
        });
        
        // Observer tous les éléments animés
        animatedElements.forEach(element => {
            observer.observe(element);
        });
    }

    /**
     * Gestion du cache pour les performances
     */
    function initCaching() {
        // Vérifier si le navigateur supporte Service Worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js')
                    .then(registration => {
                        console.log('Service Worker enregistré avec succès:', registration);
                    })
                    .catch(error => {
                        console.log('Échec de l\'enregistrement du Service Worker:', error);
                    });
            });
        }
    }

    /**
     * Lazy loading des images pour les performances
     */
    function initLazyLoading() {
        // Utiliser l'attribut loading="lazy" natif si disponible
        if ('loading' in HTMLImageElement.prototype) {
            const lazyImages = document.querySelectorAll('img[data-src]');
            lazyImages.forEach(img => {
                img.src = img.dataset.src;
                img.setAttribute('loading', 'lazy');
            });
        } else {
            // Fallback pour les navigateurs qui ne supportent pas le lazy loading natif
            const lazyImages = document.querySelectorAll('img[data-src]');
            
            if (lazyImages.length === 0) return;
            
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const image = entry.target;
                        image.src = image.dataset.src;
                        imageObserver.unobserve(image);
                    }
                });
            });
            
            lazyImages.forEach(image => {
                imageObserver.observe(image);
            });
        }
    }

})();
