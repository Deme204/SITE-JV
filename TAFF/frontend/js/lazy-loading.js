/**
 * Module de chargement différé des images
 * Améliore les performances en ne chargeant les images qu'au moment où elles entrent dans le viewport
 */

(function() {
  'use strict';

  // Vérifier si IntersectionObserver est supporté
  if (!('IntersectionObserver' in window)) {
    // Chargement immédiat de toutes les images si non supporté
    loadAllImages();
    return;
  }

  // Configurer l'observer
  const imageObserver = new IntersectionObserver(onIntersection, {
    rootMargin: '50px 0px',
    threshold: 0.01
  });

  // Sélectionner toutes les images à charger de manière différée
  document.addEventListener('DOMContentLoaded', () => {
    const lazyImages = document.querySelectorAll('img[data-src], img[data-srcset]');
    
    lazyImages.forEach(image => {
      // Ajouter un effet de placeholder
      addPlaceholder(image);
      // Observer l'image
      imageObserver.observe(image);
    });
  });

  /**
   * Callback lorsque l'image entre dans le viewport
   * @param {IntersectionObserverEntry[]} entries - Entrées observées
   */
  function onIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const image = entry.target;
        loadImage(image);
        imageObserver.unobserve(image);
      }
    });
  }

  /**
   * Charge une image spécifique
   * @param {HTMLImageElement} image - Image à charger
   */
  function loadImage(image) {
    // Charger l'attribut src
    if (image.dataset.src) {
      image.src = image.dataset.src;
    }

    // Charger l'attribut srcset pour les images responsives
    if (image.dataset.srcset) {
      image.srcset = image.dataset.srcset;
    }

    // Animation de fondu lors du chargement
    image.classList.add('lazy-loading');

    // Supprimer le placeholder une fois l'image chargée
    image.onload = () => {
      image.classList.add('lazy-loaded');
      image.classList.remove('lazy-loading');
      removePlaceholder(image);
    };
  }

  /**
   * Ajoute un placeholder à l'image pendant le chargement
   * @param {HTMLImageElement} image - Image cible
   */
  function addPlaceholder(image) {
    // Créer un effet de placeholder basé sur les dimensions de l'image
    let width = image.getAttribute('width') || 300;
    let height = image.getAttribute('height') || 200;
    
    // Appliquer un style de fond au placeholder
    image.style.backgroundColor = '#f0f0f0';
    image.style.width = `${width}px`;
    image.style.height = `${height}px`;
    
    // Ajouter une animation de pulsation au placeholder
    image.classList.add('placeholder-pulse');
  }

  /**
   * Supprime le placeholder une fois l'image chargée
   * @param {HTMLImageElement} image - Image cible
   */
  function removePlaceholder(image) {
    image.style.backgroundColor = '';
    image.classList.remove('placeholder-pulse');
  }

  /**
   * Charge toutes les images immédiatement (fallback)
   */
  function loadAllImages() {
    const lazyImages = document.querySelectorAll('img[data-src], img[data-srcset]');
    
    lazyImages.forEach(image => {
      if (image.dataset.src) {
        image.src = image.dataset.src;
      }
      
      if (image.dataset.srcset) {
        image.srcset = image.dataset.srcset;
      }
    });
  }

  /**
   * Ajoute le lazy loading aux images insérées dynamiquement
   * @param {NodeList|Array} images - Images à traiter
   */
  window.lazyLoadImages = function(images) {
    if (!images || !images.length) return;
    
    images.forEach(image => {
      if (image.tagName === 'IMG') {
        addPlaceholder(image);
        imageObserver.observe(image);
      }
    });
  };

  /**
   * Re-initialise le lazy loading (utile après des modifications du DOM)
   */
  window.reinitLazyLoading = function() {
    const lazyImages = document.querySelectorAll('img[data-src], img[data-srcset]');
    
    lazyImages.forEach(image => {
      if (!image.classList.contains('lazy-loaded')) {
        addPlaceholder(image);
        imageObserver.observe(image);
      }
    });
  };

})();
