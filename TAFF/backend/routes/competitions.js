const express = require('express');
const router = express.Router();

// Création d'une compétition
router.post('/create', (req, res) => {
    // Logique de création de compétition
    res.send('Compétition créée');
});

// Inscription à une compétition
router.post('/register', (req, res) => {
    // Logique d'inscription à une compétition
    res.send('Inscription à la compétition réussie');
});

// Récupération des compétitions
router.get('/', (req, res) => {
    // Logique pour récupérer les compétitions
    res.send('Liste des compétitions');
});

module.exports = router;
